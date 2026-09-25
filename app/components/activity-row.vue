<script setup lang="ts">
import type { Address } from "viem";

const props = defineProps<{
  item: ActivityItem;
  viewer: Address;
  selected?: boolean;
  timeStyle?: "relative" | "clock";
}>();
defineEmits<{ select: [] }>();
const smart = useSmartAccounts();

const view = computed(() =>
  describeActivity(props.item, props.viewer, (a) => smart.findByAddress(a)?.label),
);
const time = computed(() =>
  props.timeStyle === "clock"
    ? clockTime(props.item.createdAt)
    : relativeTime(props.item.createdAt),
);
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-[12px_15px_11px_14px] px-2 py-3 text-left transition"
    :class="selected ? 'bg-highlight text-on-sticky' : 'hover:bg-paper-deep/70'"
    @click="$emit('select')"
  >
    <span
      class="ink-dot"
      :class="{
        'border-danger! bg-danger-soft! text-danger': view.tone === 'failed',
        'border-accent! bg-accent-soft! text-accent': view.tone === 'in',
      }"
    >
      <UIcon :name="view.icon" class="size-4.5" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="hand block text-[16px] leading-tight">{{ view.title }}</span>
      <span
        class="line-clamp-2 block text-[12.5px] break-words"
        :class="selected ? 'opacity-75' : 'text-ink-soft'"
      >
        {{ view.subtitle }}<template v-if="view.subtitle"> · </template>{{ time }}
      </span>
    </span>
    <span class="flex shrink-0 flex-col items-end gap-0.5">
      <span
        class="text-[15px] font-semibold"
        :class="view.incoming && item.status !== 'failed' && !selected ? 'text-accent' : ''"
      >
        <AmountText
          v-if="view.amount"
          :value="view.amount.value"
          :decimals="view.amount.decimals"
          :symbol="view.amount.symbol"
          :sign="view.sign"
          :max="4"
        />
        <span v-else>—</span>
      </span>
      <StatusText :status="item.status" />
    </span>
  </button>
</template>
