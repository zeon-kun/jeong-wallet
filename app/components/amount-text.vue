<script setup lang="ts">
// Amounts: max 6 decimals shown, full value on hover.
const props = withDefaults(
  defineProps<{
    value: bigint | string | undefined;
    decimals?: number;
    symbol?: string;
    max?: number;
    min?: number;
    sign?: string;
  }>(),
  { decimals: 18, symbol: "ETH", max: 6, min: 0, sign: "" },
);
const big = computed(() => (props.value === undefined ? undefined : BigInt(props.value)));
</script>

<template>
  <UTooltip v-if="big !== undefined" :text="`${formatFull(big, decimals)} ${symbol}`">
    <span class="num whitespace-nowrap"
      >{{ sign }}{{ formatAmount(big, decimals, max, min)
      }}{{ symbol ? `\u00a0${symbol}` : "" }}</span
    >
  </UTooltip>
  <span v-else class="num text-pencil">…</span>
</template>
