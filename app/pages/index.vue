<script setup lang="ts">
definePageMeta({ layout: "plain" });

const passkey = usePasskey();
const smart = useSmartAccounts();
const toast = useToast();

type State = "idle" | "creating" | "cancelled" | "ready";
const state = ref<State>("idle");
const errorText = ref("");
const fileInput = ref<HTMLInputElement>();
const hasCredential = computed(() => !!passkey.credential.value);

async function createWallet() {
  state.value = "creating";
  errorText.value = "";
  try {
    await passkey.create("Jeong Wallet");
    await smart.createAccount("Main account", 0);
    await smart.setActive(0);
    state.value = "ready";
  } catch (e) {
    state.value = isUserCancel(e) ? "cancelled" : "idle";
    errorText.value = humanizeError(e);
  }
}

async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const list = await passkey.importJson(file);
    await smart.restoreAccounts(list);
    toast.add({
      title: "Backup restored",
      description: `${smart.accounts.value.length} account(s)`,
      color: "success",
    });
    await navigateTo("/wallet");
  } catch (err) {
    toast.add({ title: "Import failed", description: humanizeError(err), color: "error" });
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}

const features = [
  {
    icon: "i-lucide-key-round",
    title: "Signed with your passkey",
    text: "Every transaction is approved with biometrics.",
  },
  {
    icon: "i-lucide-shield",
    title: "Keys stay on this device",
    text: "Nothing secret is sent to a server.",
  },
  {
    icon: "i-lucide-git-fork",
    title: "Connected to a local fork",
    text: "A safe sandbox — balances aren't real ETH.",
  },
];
</script>

<template>
  <header class="flex items-start justify-between">
    <AppLogo lockup :size="36" />
    <NetworkBadge />
  </header>

  <!-- Ready -->
  <section v-if="state === 'ready' && smart.active.value" class="flex flex-1 flex-col">
    <div class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <Doodle kind="check" class="h-28 w-32 text-accent" />
      <div>
        <h1 class="hand text-[28px]">Your wallet is ready</h1>
        <p class="mt-2 text-[14px] text-ink-soft">
          Passkey saved on this device. Your smart account address is reserved and will be deployed
          with your first transaction.
        </p>
      </div>
      <div class="sketch-card w-full p-4 text-left">
        <div class="flex items-center gap-3">
          <AccountAvatar :index="0" :size="36" />
          <div class="flex-1">
            <p class="hand text-[16px]">{{ smart.active.value.label }}</p>
            <p class="text-[12px] text-ink-soft">Passkey · {{ passkey.credential.value?.rpId }}</p>
          </div>
          <span class="scribble flex items-center gap-1 text-xl text-pen">
            <Doodle kind="arrow-back" class="h-5 w-7" /> this is you!
          </span>
        </div>
        <div class="mt-3 flex items-center justify-between rounded-lg bg-paper-deep px-3 py-2.5">
          <span class="font-mono text-[12.5px] break-all">{{ smart.active.value.address }}</span>
          <AddressChip
            :address="smart.active.value.address"
            bare
            :head="0"
            :tail="0"
            class="shrink-0"
          />
        </div>
      </div>
    </div>
    <NuxtLink to="/wallet" class="btn btn-primary mt-8 w-full">Go to wallet</NuxtLink>
  </section>

  <!-- Returning user -->
  <section v-else-if="hasCredential && smart.active.value" class="flex flex-1 flex-col">
    <div class="flex flex-1 flex-col justify-center gap-6">
      <AppLogo :size="88" />
      <h1 class="hand text-[34px] leading-tight">Welcome back.</h1>
      <p class="text-ink-soft">
        Your passkey is saved on this device. Nothing to unlock — you'll approve each transaction
        with it.
      </p>
      <div class="sketch-card flex items-center gap-3 p-4">
        <AccountAvatar :index="smart.active.value.index" :size="40" />
        <div class="min-w-0 flex-1">
          <p class="hand text-[17px]">{{ smart.active.value.label }}</p>
          <p class="font-mono text-[12px] text-ink-soft">
            {{ shortAddress(smart.active.value.address) }}
          </p>
        </div>
        <span class="text-[12px] text-ink-soft">{{ smart.accounts.value.length }} account(s)</span>
      </div>
    </div>
    <NuxtLink to="/wallet" class="btn btn-primary mt-8 w-full"
      >Continue <UIcon name="i-lucide-arrow-right" class="size-5"
    /></NuxtLink>
  </section>

  <!-- Welcome -->
  <section v-else class="flex flex-1 flex-col">
    <div class="mt-10 flex items-start gap-4">
      <AppLogo :size="96" />
      <p class="scribble mt-2 text-xl text-pen">
        <Doodle kind="arrow-back" class="-mb-1 inline h-5 w-8" /><br />
        a fingerprint that<br />becomes a heart ♡ = 정
      </p>
    </div>
    <h1 class="hand mt-8 text-[34px] leading-[1.25]">
      A wallet that<br />lives on
      <span class="relative inline-block"
        >your device.<Doodle
          kind="underline"
          class="absolute -bottom-1 left-0 h-2.5 w-full text-heart"
      /></span>
    </h1>
    <p class="mt-4 text-[14.5px] text-ink-soft">
      Create a smart account secured by a passkey — your fingerprint, face or device PIN. No seed
      phrase to write down.
    </p>
    <ul class="mt-7 flex flex-col gap-4">
      <li v-for="f in features" :key="f.title" class="flex items-start gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch bg-card"
        >
          <UIcon :name="f.icon" class="size-4.5" />
        </span>
        <span>
          <span class="hand block text-[15px]">{{ f.title }}</span>
          <span class="block text-[12.5px] text-ink-soft">{{ f.text }}</span>
        </span>
      </li>
    </ul>

    <div class="mt-auto pt-10">
      <div v-if="!passkey.isSupported.value" class="sticky-note sticky-note-pink tape mb-5">
        <p class="hand">Passkeys aren't available here</p>
        <p class="text-[13px]">
          This browser doesn't support WebAuthn. Try a recent Chrome, Edge, Safari or Firefox.
        </p>
      </div>
      <div
        v-else-if="errorText"
        class="sticky-note tape mb-5"
        :class="state === 'cancelled' ? '' : 'sticky-note-pink'"
        role="alert"
      >
        <p class="hand">{{ state === "cancelled" ? "No worries" : "That didn't work" }}</p>
        <p class="text-[13px]">{{ errorText }}</p>
      </div>
      <p v-else class="scribble mb-1 flex items-center justify-end gap-1 pr-6 text-xl text-pen">
        start here!<Doodle kind="arrow-down" class="size-7 -rotate-45" />
      </p>
      <button
        type="button"
        class="btn btn-primary w-full"
        :disabled="!passkey.isSupported.value || state === 'creating'"
        @click="createWallet"
      >
        <UIcon
          :name="state === 'creating' ? 'i-lucide-loader-circle' : 'i-lucide-key-round'"
          class="size-5"
          :class="{ 'animate-spin': state === 'creating' }"
        />
        {{
          state === "creating"
            ? "Waiting for your passkey…"
            : state === "cancelled"
              ? "Try again"
              : "Create wallet with passkey"
        }}
      </button>
      <button type="button" class="btn btn-ghost mt-3 w-full" @click="fileInput?.click()">
        <UIcon name="i-lucide-file-up" class="size-5" /> Import an existing credential
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onImport"
      />
      <p class="mt-3 text-center text-[12px] text-ink-soft">
        By continuing you create a passkey on this device.
      </p>
    </div>
  </section>
</template>
