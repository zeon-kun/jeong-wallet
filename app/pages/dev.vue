<script setup lang="ts">
import type { Address } from "viem";

definePageMeta({ layout: "plain" });

const status = useChainStatus();
const smart = useSmartAccounts();
const token = useToken();
const faucet = useFaucet();
const toast = useToast();
const { publicClient, testClient, rpcUrl, bundlerUrl } = useClients();

const address = ref("");
const balance = ref<bigint>();
const minting = ref(false);

onMounted(async () => {
  await token.load();
  address.value = smart.active.value?.address ?? "";
});

let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  status.check();
  timer = setInterval(status.check, 1_500);
});
onUnmounted(() => clearInterval(timer));

const valid = computed(() => isHexAddress(address.value.trim()));
watch(
  [address, status.blockNumber],
  async () => {
    balance.value = valid.value
      ? await publicClient
          .getBalance({ address: address.value.trim() as Address })
          .catch(() => undefined)
      : undefined;
  },
  { immediate: true },
);

async function mine() {
  await testClient.mine({ blocks: 1 });
  status.check();
}
async function mint() {
  if (!valid.value) return;
  minting.value = true;
  try {
    await token.devMint(address.value.trim() as Address);
    toast.add({ title: `Minted 1,000 ${token.token.value?.symbol}`, color: "success" });
  } catch (e) {
    toast.add({ title: "Mint failed", description: humanizeError(e), color: "error" });
  } finally {
    minting.value = false;
  }
}

const rows = computed(() => [
  { label: "Chain ID", value: status.chainId.value ?? "—", ok: status.chainId.value === CHAIN_ID },
  { label: "Block number", value: status.blockNumber.value?.toString() ?? "—" },
  {
    label: "EntryPoints",
    value: status.entryPoints.value.map((e) => shortAddress(e)).join(", ") || "—",
  },
  {
    label: "MockUSDC",
    value: token.token.value ? shortAddress(token.token.value.address) : "not deployed",
  },
]);
</script>

<template>
  <header class="flex items-center gap-3">
    <NuxtLink
      to="/wallet"
      class="grid size-10 place-items-center rounded-full border-[1.6px] border-sketch"
      aria-label="Back"
    >
      <UIcon name="i-lucide-arrow-left" class="size-5" />
    </NuxtLink>
    <h1 class="hand flex-1 text-[24px]">Dev tools</h1>
    <NetworkBadge show-chain />
  </header>

  <section class="sketch-card mt-6 px-5 py-4">
    <div class="mb-3 flex items-center justify-between">
      <ScribbleHeading class="text-[19px]">Chain status</ScribbleHeading>
      <div class="flex gap-2">
        <UBadge :color="status.anvilOk.value ? 'success' : 'error'" variant="subtle"
          >anvil {{ status.anvilOk.value ? "up" : "down" }}</UBadge
        >
        <UBadge :color="status.bundlerOk.value ? 'success' : 'error'" variant="subtle"
          >bundler {{ status.bundlerOk.value ? "up" : "down" }}</UBadge
        >
      </div>
    </div>
    <dl class="ruled text-[14px]">
      <div v-for="r in rows" :key="r.label" class="flex justify-between gap-4 py-2">
        <dt class="shrink-0 text-ink-soft">{{ r.label }}</dt>
        <dd class="text-right font-mono break-all" :class="{ 'text-accent': r.ok }">
          {{ r.value }}
        </dd>
      </div>
      <div class="flex justify-between gap-4 py-2">
        <dt class="shrink-0 text-ink-soft">RPC / bundler</dt>
        <dd class="text-right font-mono text-[12px] break-all">
          {{ rpcUrl.replace(/^https?:\/\//, "") }} · {{ bundlerUrl.replace(/^https?:\/\//, "") }}
        </dd>
      </div>
    </dl>
    <button type="button" class="btn btn-outline btn-sm mt-3" @click="mine">
      <UIcon name="i-lucide-pickaxe" class="size-4" />Mine a block
    </button>
  </section>

  <section class="sketch-card mt-6 flex flex-col gap-3 px-5 py-4">
    <ScribbleHeading class="self-start text-[19px]">Fund an address</ScribbleHeading>
    <input
      v-model="address"
      class="sketch-input mt-2 font-mono text-[13px]"
      placeholder="0x…"
      :aria-invalid="!!address && !valid"
    />
    <p class="text-[13px] text-ink-soft">
      Balance: <AmountText v-if="balance !== undefined" :value="balance" /><span v-else>—</span>
    </p>
    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!valid || faucet.busy.value"
        @click="faucet.fund(address.trim() as Address)"
      >
        <UIcon
          :name="faucet.busy.value ? 'i-lucide-loader-circle' : 'i-lucide-droplet'"
          class="size-5"
          :class="{ 'animate-spin': faucet.busy.value }"
        />
        Set to {{ FUND_AMOUNT_ETH }} ETH
      </button>
      <button
        v-if="token.token.value"
        type="button"
        class="btn btn-outline"
        :disabled="!valid || minting"
        @click="mint"
      >
        <UIcon name="i-lucide-coins" class="size-5" /> Mint 1,000 {{ token.token.value.symbol }}
      </button>
    </div>
    <p class="scribble text-lg text-pen">
      anvil_setBalance is a cheat: it only exists on the local node.
    </p>
  </section>
</template>
