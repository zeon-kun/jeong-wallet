<script setup lang="ts">
// Long hex in a monospace block: truncated by default, expandable, copyable.
const props = defineProps<{ value: string; label?: string }>();
const expanded = ref(false);
const { copy } = useCopy();
const shown = computed(() =>
  expanded.value || props.value.length <= 140
    ? props.value
    : `${props.value.slice(0, 66)}…${props.value.slice(-64)}`,
);
</script>

<template>
  <div class="rounded-[10px_13px_10px_12px] border-[1.4px] border-sketch bg-paper-deep">
    <div class="flex items-center justify-between gap-2 border-b-[1.2px] border-rule px-3 py-1.5">
      <span class="hand text-[13px] text-ink-soft"
        >{{ label ?? "Signature" }} · {{ (value.length - 2) / 2 }} bytes</span
      >
      <span class="flex gap-1">
        <button
          v-if="value.length > 140"
          type="button"
          class="hand rounded px-2 text-[13px] text-pen hover:bg-card"
          @click="expanded = !expanded"
        >
          {{ expanded ? "collapse" : "expand" }}
        </button>
        <button
          type="button"
          class="hand flex items-center gap-1 rounded px-2 text-[13px] hover:bg-card"
          @click="copy(value, 'Signature copied')"
        >
          <UIcon name="i-lucide-copy" class="size-3.5" /> copy
        </button>
      </span>
    </div>
    <p class="px-3 py-2.5 font-mono text-[12px] leading-relaxed break-all">{{ shown }}</p>
  </div>
</template>
