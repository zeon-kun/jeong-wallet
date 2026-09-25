<script setup lang="ts">
import type { Address } from "viem";

// Activity grouped by day: Today, Yesterday, Sep 24...
const props = withDefaults(
  defineProps<{
    items: ActivityItem[];
    viewer: Address;
    selectedId?: string;
    limit?: number;
    grouped?: boolean;
  }>(),
  {
    grouped: true,
  },
);
defineEmits<{ select: [item: ActivityItem] }>();

const groups = computed(() => {
  const list = props.limit ? props.items.slice(0, props.limit) : props.items;
  if (!props.grouped) return [{ label: "", items: list }];
  const out: { label: string; items: ActivityItem[] }[] = [];
  for (const item of list) {
    const label = dayLabel(item.createdAt);
    const last = out.at(-1);
    if (last?.label === label) last.items.push(item);
    else out.push({ label, items: [item] });
  }
  return out;
});
</script>

<template>
  <div v-if="items.length" class="flex flex-col gap-2">
    <section v-for="g in groups" :key="g.label">
      <h3 v-if="g.label" class="scribble mt-1 mb-0.5 text-[22px] text-pen">{{ g.label }}</h3>
      <div class="ruled">
        <ActivityRow
          v-for="item in g.items"
          :key="item.id"
          :item="item"
          :viewer="viewer"
          :selected="item.id === selectedId"
          :time-style="grouped ? 'clock' : 'relative'"
          @select="$emit('select', item)"
        />
      </div>
    </section>
  </div>
  <div v-else class="flex flex-col items-center gap-2 py-10 text-center">
    <UIcon name="i-lucide-notebook-pen" class="size-8 text-pencil" />
    <p class="hand text-lg">No activity yet</p>
    <p class="scribble text-lg text-pen">your first send will show up here</p>
  </div>
</template>
