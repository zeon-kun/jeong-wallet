<script setup lang="ts">
import { parseUnits } from "viem";

definePageMeta({ title: "Tokens", subtitle: "the coins in your pocket", back: "/wallet" });

const smart = useSmartAccounts();
const token = useToken();
const activity = useActivity();
const toast = useToast();
const isDev = import.meta.dev;
const minting = ref(false);
const account = computed(() => smart.active.value!);

onMounted(async () => {
  await token.load(true);
  await token.refresh([account.value.address]);
});

async function mint() {
  minting.value = true;
  try {
    const receipt = await token.devMint(account.value.address, "1000");
    const t = token.token.value!;
    await activity.add({
      kind: "mint",
      account: account.value.address,
      to: account.value.address,
      status: "success",
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      token: {
        address: t.address,
        symbol: t.symbol,
        decimals: t.decimals,
        amount: parseUnits("1000", t.decimals).toString(),
      },
    });
    await token.refresh([account.value.address]);
    toast.add({ title: `Minted 1,000 ${t.symbol}`, color: "success", icon: "i-lucide-coins" });
  } catch (e) {
    toast.add({ title: "Mint failed", description: humanizeError(e), color: "error" });
  } finally {
    minting.value = false;
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
    <section>
      <div class="mb-3 flex items-end justify-between">
        <ScribbleHeading class="text-[20px]">Your tokens</ScribbleHeading>
        <span class="scribble text-lg text-pen">{{ account.label }}</span>
      </div>
      <div class="sketch-card ruled px-4 sm:px-5">
        <!-- Row: icon | name + amount on one line, actions below (wrap to the side on wide screens) -->
        <div class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <span class="ink-dot bg-paper-deep!"
              ><UIcon name="i-lucide-diamond" class="size-4.5"
            /></span>
            <div class="min-w-0 flex-1">
              <p class="hand text-[17px]">ETH</p>
              <p class="text-[12.5px] text-ink-soft">Ether · pays gas</p>
            </div>
            <AmountText
              :value="smart.activeBalance.value"
              :max="4"
              class="text-[16px] font-semibold"
            />
          </div>
          <div class="flex justify-end gap-2">
            <NuxtLink to="/wallet/send" class="pill">Send</NuxtLink>
          </div>
        </div>
        <div v-if="token.token.value" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <span class="ink-dot border-accent! bg-accent-soft! text-accent"
              ><span class="hand text-[13px]">$</span></span
            >
            <div class="min-w-0 flex-1">
              <p class="hand text-[17px]">{{ token.token.value.symbol }}</p>
              <p class="text-[12.5px] break-words text-ink-soft">
                {{ token.token.value.name }} ·
                <span class="font-mono">{{ shortAddress(token.token.value.address) }}</span>
              </p>
            </div>
            <AmountText
              :value="token.balances.value[account.address] ?? 0n"
              :decimals="token.token.value.decimals"
              :symbol="token.token.value.symbol"
              :max="2"
              class="text-[16px] font-semibold"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              v-if="isDev"
              type="button"
              class="pill pill-active"
              :disabled="minting"
              @click="mint"
            >
              <UIcon
                :name="minting ? 'i-lucide-loader-circle' : 'i-lucide-plus'"
                class="size-4"
                :class="{ 'animate-spin': minting }"
              />Mint 1,000
            </button>
            <NuxtLink :to="{ path: '/wallet/send', query: { asset: 'token' } }" class="pill"
              >Send</NuxtLink
            >
          </div>
        </div>
      </div>

      <div
        v-if="token.loaded.value && !token.token.value"
        class="sticky-note tape mt-6 rotate-[-0.5deg]"
      >
        <p class="hand">No token yet</p>
        <p class="text-[13px]">Deploy MockUSDC to the local fork, then come back:</p>
        <code class="mt-2 block rounded bg-white/60 px-2 py-1 font-mono text-[12px]"
          >bash scripts/deploy-token.sh</code
        >
      </div>
    </section>

    <section class="flex flex-col gap-5">
      <NuxtLink
        to="/wallet/batch"
        class="sketch-card group flex items-center gap-4 px-5 py-5 hover:bg-paper-deep/60"
      >
        <span
          class="grid size-12 shrink-0 place-items-center rounded-[12px_14px_11px_13px] border-[1.6px] border-sketch bg-highlight text-on-sticky"
        >
          <UIcon name="i-lucide-layers" class="size-6" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="hand block text-[18px]">Batch builder</span>
          <span class="block text-[13px] text-ink-soft"
            >Several calls, one UserOp, one passkey prompt.</span
          >
        </span>
        <UIcon name="i-lucide-chevron-right" class="size-5 text-ink-soft" />
      </NuxtLink>
      <p class="scribble px-2 text-xl text-pen">
        smart accounts can do many things at once — an EOA would need one signature per transaction
      </p>
    </section>
  </div>
</template>
