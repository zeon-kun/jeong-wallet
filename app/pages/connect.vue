<script setup lang="ts">
import { decodeFunctionData, erc20Abi, hexToString, isHex, type Address, type Hex } from "viem";
import { ERRORS, type JeongMessage, type JeongRequest } from "~~/sdk/protocol";

// Popup approval page for dApps (M6). Always the mobile layout.
definePageMeta({ layout: "plain" });

const route = useRoute();
const passkey = usePasskey();
const smart = useSmartAccounts();
const apps = useConnectedApps();
const token = useToken();
const sender = useSend();

const origin = typeof route.query.origin === "string" ? route.query.origin : "";
const allowed = ref(false);
const request = ref<JeongRequest>();
const busy = ref(false);
const done = ref<"approved" | "rejected">();
const errorText = ref("");
const pickedIndex = ref(0);

const connected = computed(() => apps.get(origin));
const hostLabel = computed(() => {
  try {
    return new URL(origin).host;
  } catch {
    return origin || "unknown";
  }
});

function respond(payload: { result?: unknown; error?: { code: number; message: string } }) {
  if (!request.value || !window.opener) return;
  // Explicit target origin, never "*".
  window.opener.postMessage({ type: "jeong:response", id: request.value.id, ...payload }, origin);
}

function onMessage(event: MessageEvent<JeongMessage>) {
  // Only the origin that opened us, only our opener window, only requests.
  if (!allowed.value || event.origin !== origin || event.source !== window.opener) return;
  if (event.data?.type !== "jeong:request" || request.value) return;
  request.value = event.data;
  const needsConnection = ["personal_sign", "eth_sendTransaction"].includes(event.data.method);
  if (needsConnection && !connected.value) {
    respond({ error: ERRORS.unauthorized });
    done.value = "rejected";
    errorText.value = "This app isn't connected yet.";
    setTimeout(() => window.close(), 1500);
  }
}

onMounted(async () => {
  await apps.load();
  await token.load();
  allowed.value = apps.allowedOrigins().includes(origin) && !!window.opener;
  if (!allowed.value) return; // unknown origin: no message is ever sent to it
  pickedIndex.value = connected.value?.accountIndex ?? smart.active.value?.index ?? 0;
  smart.refresh();
  window.addEventListener("message", onMessage);
  window.opener.postMessage({ type: "jeong:ready" }, origin);
});
onUnmounted(() => window.removeEventListener("message", onMessage));

// ---- request views ----
const signParams = computed(() => {
  if (request.value?.method !== "personal_sign") return undefined;
  const [data] = (request.value.params ?? []) as [Hex, Address];
  let text: string | undefined;
  if (isHex(data)) {
    try {
      const decoded = hexToString(data);
      text = /^[\P{C}\n\r\t]*$/u.test(decoded) ? decoded : undefined;
    } catch {}
  } else text = String(data);
  return { data, text };
});

const tx = computed(() => {
  if (request.value?.method !== "eth_sendTransaction") return undefined;
  const [t] = (request.value.params ?? []) as [{ to: Address; value?: Hex; data?: Hex }];
  const value = t?.value ? BigInt(t.value) : 0n;
  let decoded: string | undefined;
  if (t?.data && t.data !== "0x") {
    try {
      const d = decodeFunctionData({ abi: erc20Abi, data: t.data });
      const isOurToken = token.token.value && sameAddress(token.token.value.address, t.to);
      if (d.functionName === "transfer" && isOurToken)
        decoded = `transfer ${formatAmount(d.args[1] as bigint, token.token.value!.decimals)} ${token.token.value!.symbol} to ${shortAddress(d.args[0] as string)}`;
      else decoded = `${d.functionName}(…)`;
    } catch {
      decoded = `unknown call ${t.data.slice(0, 10)}`;
    }
  }
  return { to: t?.to, value, data: t?.data, decoded };
});
const account = computed(() =>
  smart.accounts.value.find(
    (a) => a.index === (connected.value?.accountIndex ?? pickedIndex.value),
  ),
);

async function approve() {
  if (!request.value) return;
  busy.value = true;
  errorText.value = "";
  try {
    const m = request.value.method;
    if (m === "eth_requestAccounts") {
      const acc = smart.accounts.value.find((a) => a.index === pickedIndex.value)!;
      await apps.connect({ origin, accountIndex: acc.index, address: acc.address });
      respond({ result: [acc.address] });
    } else if (m === "personal_sign") {
      const sa = await smart.getAccount(connected.value!.accountIndex);
      const sig = await sa.signMessage({
        message: isHex(signParams.value!.data)
          ? { raw: signParams.value!.data }
          : String(signParams.value!.data),
      });
      respond({ result: sig });
    } else if (m === "eth_sendTransaction") {
      const t = tx.value!;
      const item = await sender.send(
        [{ to: t.to, value: t.value, data: t.data }],
        { kind: "send-eth", to: t.to, value: t.value.toString(), note: `via ${hostLabel.value}` },
        { index: connected.value!.accountIndex },
      );
      if (item.status !== "success") throw new Error(item.error ?? "Transaction failed");
      respond({ result: item.txHash });
    } else {
      respond({ error: ERRORS.unsupported });
    }
    done.value = "approved";
    setTimeout(() => window.close(), 900);
  } catch (e) {
    errorText.value = humanizeError(e);
    if (!isUserCancel(e)) {
      respond({ error: { code: ERRORS.internal.code, message: errorText.value } });
      done.value = "rejected";
    }
  } finally {
    busy.value = false;
  }
}

const closeWindow = () => window.close();

function reject() {
  respond({ error: ERRORS.userRejected });
  done.value = "rejected";
  setTimeout(() => window.close(), 300);
}

const heading = computed(() => {
  switch (request.value?.method) {
    case "eth_requestAccounts":
      return connected.value ? "Reconnect" : "Connect";
    case "personal_sign":
      return "Signature request";
    case "eth_sendTransaction":
      return "Transaction request";
    default:
      return "Request";
  }
});
</script>

<template>
  <header class="flex items-start justify-between">
    <AppLogo lockup :size="32" />
    <NetworkBadge />
  </header>

  <!-- Not allowlisted: say nothing to the opener -->
  <section
    v-if="!allowed"
    class="flex flex-1 flex-col items-center justify-center gap-4 text-center"
  >
    <Doodle kind="cross" class="h-24 w-28 text-danger" />
    <p class="hand text-2xl">Unknown app</p>
    <p class="text-[14px] text-ink-soft">
      <span class="font-mono">{{ origin || "(no origin)" }}</span> isn't on this wallet's allowlist,
      so it gets no response.
    </p>
    <button type="button" class="btn btn-outline" @click="closeWindow">Close</button>
  </section>

  <section
    v-else-if="!passkey.credential.value"
    class="flex flex-1 flex-col items-center justify-center gap-4 text-center"
  >
    <p class="hand text-2xl">No wallet on this device yet</p>
    <p class="text-[14px] text-ink-soft">Create one first, then try again from the app.</p>
    <NuxtLink to="/" class="btn btn-primary">Set up Jeong Wallet</NuxtLink>
  </section>

  <section
    v-else-if="done"
    class="flex flex-1 flex-col items-center justify-center gap-4 text-center"
  >
    <Doodle
      :kind="done === 'approved' ? 'check' : 'cross'"
      class="h-24 w-28"
      :class="done === 'approved' ? 'text-accent' : 'text-danger'"
    />
    <p class="hand text-2xl">{{ done === "approved" ? "Done" : "Rejected" }}</p>
    <p v-if="errorText" class="text-[14px] text-ink-soft">{{ errorText }}</p>
    <p class="scribble text-lg text-pen">this window closes by itself</p>
  </section>

  <section v-else-if="!request" class="flex flex-1 flex-col items-center justify-center gap-3">
    <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-pencil" />
    <p class="text-[14px] text-ink-soft">Waiting for {{ hostLabel }}…</p>
  </section>

  <section v-else class="flex flex-1 flex-col pt-6">
    <p class="scribble text-xl text-pen">a note from</p>
    <div class="sketch-card mt-1 flex items-center gap-3 px-4 py-3">
      <span
        class="grid size-10 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch bg-sticky text-on-sticky"
        ><UIcon name="i-lucide-app-window" class="size-5"
      /></span>
      <div class="min-w-0">
        <p class="font-mono text-[15px] font-medium break-all">{{ hostLabel }}</p>
        <p class="text-[12px]" :class="connected ? 'text-accent' : 'text-ink-soft'">
          {{ connected ? "connected" : "not connected yet" }}
        </p>
      </div>
    </div>

    <h1 class="hand mt-6 text-[26px]">{{ heading }}</h1>

    <!-- connect -->
    <template v-if="request.method === 'eth_requestAccounts'">
      <p class="mt-1 text-[14px] text-ink-soft">
        The app wants to see this account's address. It can then <b>ask</b> you to sign or send —
        never without this window.
      </p>
      <div class="mt-4 flex flex-col gap-1.5">
        <button
          v-for="a in smart.accounts.value"
          :key="a.index"
          type="button"
          class="flex items-center gap-3 rounded-[12px_15px_11px_14px] border-[1.4px] px-3 py-2.5 text-left"
          :class="
            a.index === pickedIndex ? 'border-sketch bg-highlight text-on-sticky' : 'border-rule'
          "
          @click="pickedIndex = a.index"
        >
          <AccountAvatar :index="a.index" :size="30" />
          <span class="min-w-0 flex-1">
            <span class="hand block truncate">{{ a.label }}</span>
            <span class="block font-mono text-[11px] opacity-70">{{
              shortAddress(a.address)
            }}</span>
          </span>
          <UIcon v-if="a.index === pickedIndex" name="i-lucide-check" class="size-4" />
        </button>
      </div>
    </template>

    <!-- sign -->
    <template v-else-if="request.method === 'personal_sign' && signParams">
      <p class="mt-1 text-[14px] text-ink-soft">
        Signing is free and sends nothing. Only sign text you understand.
      </p>
      <blockquote
        v-if="signParams.text !== undefined"
        class="mt-4 max-h-56 overflow-auto rounded-lg border-[1.4px] border-sketch bg-card px-4 py-3 text-[15px] break-words whitespace-pre-wrap"
      >
        {{ signParams.text }}
      </blockquote>
      <SignatureBlock v-else class="mt-4" :value="signParams.data" label="Raw data" />
    </template>

    <!-- transaction -->
    <template v-else-if="request.method === 'eth_sendTransaction' && tx">
      <div class="mt-3 text-center">
        <p class="num text-[38px] font-semibold"><AmountText :value="tx.value" /></p>
      </div>
      <dl class="sketch-card mt-3 flex flex-col gap-2.5 px-4 py-3 text-[14px]">
        <div class="flex justify-between gap-3">
          <dt class="text-ink-soft">To</dt>
          <dd><AddressChip :address="tx.to" bare /></dd>
        </div>
        <div v-if="tx.decoded" class="flex justify-between gap-3">
          <dt class="text-ink-soft">Call</dt>
          <dd class="text-right break-all">{{ tx.decoded }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-ink-soft">Network</dt>
          <dd>Local fork · {{ CHAIN_ID }}</dd>
        </div>
      </dl>
    </template>

    <p
      v-if="account && request.method !== 'eth_requestAccounts'"
      class="mt-4 flex items-center gap-2 text-[13px] text-ink-soft"
    >
      from <AccountAvatar :index="account.index" :size="20" />
      <span class="hand text-ink">{{ account.label }}</span>
      <AmountText :value="smart.balances.value[account.address]" :max="4" />
    </p>

    <div v-if="errorText" class="sticky-note sticky-note-pink tape mt-5" role="alert">
      <p class="text-[13px]">{{ errorText }}</p>
    </div>

    <div class="mt-auto flex flex-col gap-2 pt-8">
      <p
        v-if="request.method !== 'eth_requestAccounts'"
        class="scribble flex items-center justify-center gap-2 text-lg text-pen"
      >
        <UIcon name="i-lucide-shield-check" class="size-4" /> approve with your passkey ♡
      </p>
      <button type="button" class="btn btn-primary w-full" :disabled="busy" @click="approve">
        <UIcon v-if="busy" name="i-lucide-loader-circle" class="size-5 animate-spin" />
        {{
          request.method === "eth_requestAccounts"
            ? "Connect"
            : request.method === "personal_sign"
              ? "Sign"
              : "Approve and send"
        }}
      </button>
      <button type="button" class="btn btn-ghost w-full" :disabled="busy" @click="reject">
        Reject
      </button>
    </div>
  </section>
</template>
