<script setup lang="ts">
import type { Address } from "viem";

// Review card: what will be signed. Every send goes through this before the passkey prompt.
defineProps<{
  amount: bigint;
  decimals: number;
  symbol: string;
  to?: Address;
  toLabel?: string;
  fee?: bigint;
  feeError?: string;
  deploys?: boolean;
  isEth: boolean;
}>();
const smart = useSmartAccounts();
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <p class="hand text-[15px] text-ink-soft">You're sending</p>
      <p class="num relative mx-auto mt-1 inline-flex items-baseline gap-2 font-semibold">
        <AmountText
          :value="amount"
          :decimals="decimals"
          symbol=""
          class="text-[46px] leading-none"
        />
        <span class="text-xl text-ink-soft">{{ symbol }}</span>
        <Doodle kind="underline" class="absolute -bottom-2.5 left-0 h-2.5 w-full text-heart" />
      </p>
    </div>

    <div class="sketch-card px-4 py-3">
      <div class="flex items-center gap-3 py-1.5">
        <AccountAvatar :index="smart.active.value?.index" :size="34" />
        <div class="flex-1">
          <p class="hand text-[12px] text-ink-soft">From</p>
          <p class="hand text-[15px]">{{ smart.active.value?.label }}</p>
        </div>
        <span class="font-mono text-[12px] text-ink-soft">{{
          shortAddress(smart.active.value?.address)
        }}</span>
      </div>
      <div class="flex items-center gap-2 border-b-[1.2px] border-rule py-1 pl-2.5 text-ink-soft">
        <UIcon name="i-lucide-arrow-down" class="size-4" />
      </div>
      <div class="flex items-center gap-3 py-1.5">
        <AccountAvatar
          v-if="smart.findByAddress(to)"
          :index="smart.findByAddress(to)!.index"
          :size="34"
        />
        <span v-else class="ink-dot size-[34px]!"
          ><UIcon name="i-lucide-user-round" class="size-4"
        /></span>
        <div class="flex-1">
          <p class="hand text-[12px] text-ink-soft">To</p>
          <p class="hand text-[15px]">{{ toLabel ?? "New recipient" }}</p>
        </div>
        <span class="font-mono text-[12px] text-ink-soft">{{ to ? shortAddress(to) : "—" }}</span>
      </div>
    </div>

    <dl class="flex flex-col gap-2.5 px-1 text-[14px]">
      <div class="flex justify-between">
        <dt class="text-ink-soft">Network</dt>
        <dd>Local fork · {{ CHAIN_ID }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-ink-soft">Network fee (max)</dt>
        <dd>
          <span v-if="feeError" class="text-danger">{{ feeError }}</span>
          <AmountText v-else-if="fee !== undefined" :value="fee" :max="6" />
          <UIcon v-else name="i-lucide-loader-circle" class="size-4 animate-spin text-pencil" />
        </dd>
      </div>
      <div class="flex justify-between border-t-[1.2px] border-rule pt-3">
        <dt class="hand">Total</dt>
        <dd class="font-semibold">
          <template v-if="isEth"><AmountText :value="amount + (fee ?? 0n)" /></template>
          <template v-else
            ><AmountText :value="amount" :decimals="decimals" :symbol="symbol" /> +
            <AmountText :value="fee ?? 0n"
          /></template>
        </dd>
      </div>
    </dl>

    <div v-if="deploys" class="sticky-note tape rotate-[-0.5deg]">
      <p class="hand">First transaction ✦</p>
      <p class="text-[13px]">
        This first transaction also creates your account on-chain (the fee is a bit higher).
      </p>
    </div>
  </div>
</template>
