<script setup lang="ts">
import type { Address, Hex, TypedDataDefinition } from "viem";

definePageMeta({
  title: "Sign",
  subtitle: "…and verify. your autograph, in cryptography",
  back: "/wallet",
});

const smart = useSmartAccounts();
const activity = useActivity();
const { publicClient } = useClients();
const toast = useToast();

const tabs = [
  { label: "Sign", value: "sign", icon: "i-lucide-pen-line" },
  { label: "Verify", value: "verify", icon: "i-lucide-badge-check" },
  { label: "Typed data", value: "typed", icon: "i-lucide-braces" },
];
const tab = ref("sign");

// ---- Sign (EIP-191 personal message) ----
const message = ref("정 — I own this account.");
const signStep = ref<"write" | "review" | "done">("write");
const signing = ref(false);
const signature = ref<Hex>();
const signedDeployed = ref<boolean>();

async function sign() {
  signing.value = true;
  try {
    const account = await smart.getAccount(smart.active.value!.index);
    signedDeployed.value = await account.isDeployed();
    // Deployed: plain ERC-1271 signature. Undeployed: wrapped in ERC-6492 (factory + calldata),
    // so a verifier can simulate the deployment and then check it.
    signature.value = await account.signMessage({ message: message.value });
    signStep.value = "done";
    await activity.add({
      kind: "sign",
      account: smart.active.value!.address,
      status: "success",
      note: `“${message.value.slice(0, 32)}${message.value.length > 32 ? "…" : ""}”`,
    });
  } catch (e) {
    toast.add({ title: "Not signed", description: humanizeError(e), color: "error" });
  } finally {
    signing.value = false;
  }
}
function verifyThis() {
  vAddress.value = smart.active.value!.address;
  vMessage.value = message.value;
  vSignature.value = signature.value ?? "";
  vResult.value = undefined;
  tab.value = "verify";
}

// ---- Verify ----
const vAddress = ref("");
const vMessage = ref("");
const vSignature = ref("");
const vResult = ref<boolean>();
const verifying = ref(false);
onMounted(() => (vAddress.value = smart.active.value?.address ?? ""));
watch([vAddress, vMessage, vSignature], () => (vResult.value = undefined));

async function verify() {
  verifying.value = true;
  try {
    // verifyMessage handles EOA (ecrecover), ERC-1271 (deployed contract) and ERC-6492 (counterfactual).
    vResult.value = await publicClient.verifyMessage({
      address: vAddress.value.trim() as Address,
      message: vMessage.value,
      signature: vSignature.value.trim() as Hex,
    });
  } catch {
    vResult.value = false;
  } finally {
    verifying.value = false;
  }
}
const canVerify = computed(
  () => isHexAddress(vAddress.value.trim()) && /^0x[0-9a-fA-F]+$/.test(vSignature.value.trim()),
);

// ---- EIP-712 typed data ----
const typed = computed(
  () =>
    ({
      domain: {
        name: "Jeong Wallet Demo",
        version: "1",
        chainId: CHAIN_ID,
        verifyingContract: "0x0000000000000000000000000000000000000000",
      },
      types: {
        Note: [
          { name: "from", type: "address" },
          { name: "to", type: "string" },
          { name: "contents", type: "string" },
        ],
      },
      primaryType: "Note",
      message: {
        from: smart.active.value!.address,
        to: "a friend",
        contents: "Thanks for lunch ♡",
      },
    }) as const satisfies TypedDataDefinition,
);
const typedSig = ref<Hex>();
const typedValid = ref<boolean>();
const typedBusy = ref(false);
async function signTyped() {
  typedBusy.value = true;
  typedValid.value = undefined;
  try {
    const account = await smart.getAccount(smart.active.value!.index);
    typedSig.value = await account.signTypedData(typed.value);
    typedValid.value = await publicClient.verifyTypedData({
      address: smart.active.value!.address,
      ...typed.value,
      signature: typedSig.value,
    });
  } catch (e) {
    toast.add({ title: "Not signed", description: humanizeError(e), color: "error" });
  } finally {
    typedBusy.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-[720px]">
    <UTabs
      v-model="tab"
      :items="tabs"
      :content="false"
      variant="link"
      class="mb-6"
      :ui="{
        list: 'border-b-[1.5px] border-rule',
        trigger: 'hand text-[16px] data-[state=active]:text-ink',
        indicator: 'bg-heart h-[2px]',
      }"
    />

    <!-- SIGN -->
    <section v-if="tab === 'sign'" class="flex flex-col gap-5">
      <template v-if="signStep === 'write'">
        <label class="flex flex-col gap-2">
          <span class="label">Message</span>
          <textarea
            v-model="message"
            rows="5"
            class="sketch-input resize-y text-[15px]"
            placeholder="Write anything…"
          />
        </label>
        <p class="scribble text-lg text-pen">plain text, signed as an EIP-191 personal message</p>
        <button
          type="button"
          class="btn btn-primary w-full"
          :disabled="!message"
          @click="signStep = 'review'"
        >
          Review
        </button>
      </template>

      <template v-else-if="signStep === 'review'">
        <div class="sketch-card tape relative flex flex-col gap-4 px-6 py-6">
          <h2 class="hand text-xl">You're signing</h2>
          <blockquote class="rounded-lg bg-paper-deep px-4 py-3 text-[15px] whitespace-pre-wrap">
            {{ message }}
          </blockquote>
          <div class="flex items-center gap-3 text-sm">
            <AccountAvatar :index="smart.active.value!.index" :size="28" />
            <span class="hand">{{ smart.active.value!.label }}</span>
            <span class="font-mono text-ink-soft">{{
              shortAddress(smart.active.value!.address)
            }}</span>
          </div>
          <p class="text-[13px] text-ink-soft">
            Signing costs nothing and sends nothing. It proves this account agrees to the text
            above.
            <template v-if="!smart.activeDeployed.value">
              Your account isn't deployed yet, so the signature will be wrapped in
              ERC-6492.</template
            >
          </p>
        </div>
        <p class="scribble flex items-center justify-center gap-2 text-xl text-pen">
          <UIcon name="i-lucide-shield-check" class="size-4" />you'll approve this with your passkey
          ♡
        </p>
        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="btn btn-outline" @click="signStep = 'write'">Edit</button>
          <button type="button" class="btn btn-primary" :disabled="signing" @click="sign">
            <UIcon
              :name="signing ? 'i-lucide-loader-circle' : 'i-lucide-key-round'"
              class="size-5"
              :class="{ 'animate-spin': signing }"
            />
            Sign
          </button>
        </div>
      </template>

      <template v-else-if="signature">
        <div class="flex items-center gap-4">
          <Doodle kind="check" class="h-16 w-20 text-accent" />
          <div>
            <p class="hand text-2xl">Signed</p>
            <p class="text-[13px] text-ink-soft">
              {{
                signedDeployed
                  ? "ERC-1271 signature (checked by the deployed account contract)"
                  : "ERC-6492 wrapped signature (account not deployed yet)"
              }}
            </p>
          </div>
        </div>
        <SignatureBlock :value="signature" />
        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="btn btn-outline" @click="signStep = 'write'">
            Sign another
          </button>
          <button type="button" class="btn btn-primary" @click="verifyThis">
            <UIcon name="i-lucide-badge-check" class="size-5" />Verify it
          </button>
        </div>
      </template>
    </section>

    <!-- VERIFY -->
    <section v-else-if="tab === 'verify'" class="flex flex-col gap-4">
      <label class="flex flex-col gap-2">
        <span class="label">Address</span>
        <input
          v-model="vAddress"
          class="sketch-input font-mono text-[13px]"
          placeholder="0x…"
          spellcheck="false"
        />
      </label>
      <label class="flex flex-col gap-2">
        <span class="label">Message</span>
        <textarea v-model="vMessage" rows="3" class="sketch-input resize-y text-[15px]" />
      </label>
      <label class="flex flex-col gap-2">
        <span class="label">Signature</span>
        <textarea
          v-model="vSignature"
          rows="4"
          class="sketch-input resize-y font-mono text-[12px]"
          placeholder="0x…"
          spellcheck="false"
        />
      </label>
      <button
        type="button"
        class="btn btn-primary w-full"
        :disabled="!canVerify || verifying"
        @click="verify"
      >
        <UIcon v-if="verifying" name="i-lucide-loader-circle" class="size-5 animate-spin" /> Verify
      </button>
      <div v-if="vResult !== undefined" class="flex items-center gap-4 pt-2" role="status">
        <Doodle
          :kind="vResult ? 'check' : 'cross'"
          class="h-20 w-24"
          :class="vResult ? 'text-accent' : 'text-danger'"
        />
        <div>
          <p class="hand text-2xl" :class="vResult ? 'text-accent' : 'text-danger'">
            {{ vResult ? "Valid" : "Invalid" }}
          </p>
          <p class="text-[13px] text-ink-soft">
            {{
              vResult
                ? "This address signed exactly this message."
                : "The signature doesn't match this address and message. Even one changed character breaks it."
            }}
          </p>
        </div>
      </div>
    </section>

    <!-- TYPED DATA -->
    <section v-else class="flex flex-col gap-4">
      <p class="text-[14px] text-ink-soft">
        EIP-712 signs structured data. Wallets can show each field instead of an opaque hash.
      </p>
      <div class="sketch-card px-5 py-4">
        <p class="hand mb-2 text-[15px] text-ink-soft">
          {{ typed.domain.name }} · v{{ typed.domain.version }} · chain {{ typed.domain.chainId }}
        </p>
        <dl class="ruled text-[14px]">
          <div class="flex justify-between gap-4 py-2">
            <dt class="hand">from</dt>
            <dd class="font-mono text-[12px]">{{ shortAddress(typed.message.from) }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2">
            <dt class="hand">to</dt>
            <dd>{{ typed.message.to }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2">
            <dt class="hand">contents</dt>
            <dd>{{ typed.message.contents }}</dd>
          </div>
        </dl>
      </div>
      <button type="button" class="btn btn-primary w-full" :disabled="typedBusy" @click="signTyped">
        <UIcon
          :name="typedBusy ? 'i-lucide-loader-circle' : 'i-lucide-key-round'"
          class="size-5"
          :class="{ 'animate-spin': typedBusy }"
        />
        Sign typed data
      </button>
      <template v-if="typedSig">
        <SignatureBlock :value="typedSig" />
        <p
          class="hand flex items-center gap-2 text-lg"
          :class="typedValid ? 'text-accent' : 'text-danger'"
        >
          <UIcon
            :name="typedValid ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
            class="size-5"
          />
          {{ typedValid ? "verifyTypedData: valid" : "verifyTypedData: invalid" }}
        </p>
      </template>
    </section>
  </div>
</template>
