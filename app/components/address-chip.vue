<script setup lang="ts">
const props = withDefaults(
  defineProps<{ address: string; bare?: boolean; head?: number; tail?: number }>(),
  {
    bare: false,
    head: 6,
    tail: 4,
  },
);
const { copy } = useCopy();
</script>

<template>
  <UTooltip :text="props.address">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 font-mono text-[13px] text-ink transition hover:text-pen"
      :class="
        bare
          ? ''
          : 'rounded-lg border-[1.4px] border-sketch bg-card px-2.5 py-1 shadow-[2px_2px_0_var(--jw-shadow)]'
      "
      :aria-label="`Copy address ${props.address}`"
      @click="copy(props.address, 'Address copied')"
    >
      {{ shortAddress(props.address, head, tail) }}
      <UIcon name="i-lucide-copy" class="size-3.5 opacity-70" />
    </button>
  </UTooltip>
</template>
