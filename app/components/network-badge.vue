<script setup lang="ts">
withDefaults(defineProps<{ showChain?: boolean }>(), { showChain: false });
const { anvilOk } = useChainStatus();
</script>

<template>
  <div class="flex flex-col items-end gap-0.5">
    <UTooltip
      :text="anvilOk === false ? 'Local chain is down' : 'Anvil fork of Sepolia. Not real ETH.'"
    >
      <span
        class="hand inline-flex shrink-0 -rotate-2 whitespace-nowrap items-center gap-1.5 border-[1.2px] border-sketch bg-sticky px-2.5 py-0.5 text-[15px] text-on-sticky"
        style="border-radius: 6px 9px 5px 8px"
      >
        <span class="size-2 rounded-full" :class="anvilOk === false ? 'bg-pencil' : 'bg-heart'" />
        Local fork
      </span>
    </UTooltip>
    <span v-if="showChain" class="font-mono text-[11px] text-ink-soft">chain {{ CHAIN_ID }}</span>
  </div>
</template>
