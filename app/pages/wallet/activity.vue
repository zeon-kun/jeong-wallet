<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";

definePageMeta({ title: "Activity", subtitle: "every page of your story" });

const route = useRoute();
const smart = useSmartAccounts();
const activity = useActivity();
const isDesktop = useMediaQuery("(min-width: 1024px)");

type Filter = "all" | "sent" | "received" | "pending";
const filter = ref<Filter>("all");
const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "received", label: "Received" },
  { key: "pending", label: "Pending" },
];

const viewer = computed(() => smart.active.value!.address);
const all = computed(() => activity.forAccount(viewer.value));
const items = computed(() =>
  all.value.filter((i) => {
    if (filter.value === "pending") return i.status === "pending";
    if (filter.value === "all") return true;
    const dir = activity.direction(i, viewer.value);
    return filter.value === "received" ? dir === "in" : dir !== "in";
  }),
);

const selectedId = ref<string | undefined>(
  typeof route.query.id === "string" ? route.query.id : undefined,
);
const selected = computed(
  () =>
    all.value.find((i) => i.id === selectedId.value) ??
    (isDesktop.value ? items.value[0] : undefined),
);
const modalOpen = computed({
  get: () => !isDesktop.value && !!selectedId.value && !!selected.value,
  set: (v) => {
    if (!v) selectedId.value = undefined;
  },
});
</script>

<template>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-10">
    <section>
      <h1 class="hand relative mb-5 inline-block text-[32px] lg:hidden">
        Activity<Doodle
          kind="underline"
          class="absolute -bottom-1.5 left-0 h-2.5 w-full text-heart"
        />
      </h1>
      <div class="mb-5 flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="pill"
          :aria-pressed="filter === f.key"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="lg:sketch-card lg:px-7 lg:py-5">
        <ActivityFeed
          :items="items"
          :viewer="viewer"
          :selected-id="isDesktop ? selected?.id : undefined"
          @select="(i) => (selectedId = i.id)"
        />
      </div>
      <p v-if="items.length" class="scribble mt-6 text-center text-xl text-pencil">
        ~ that's every page so far ~
      </p>
      <p class="mt-2 text-center text-[12px] text-ink-soft">
        Only what this wallet did is recorded. Incoming ETH from outside isn't indexed.
      </p>
    </section>

    <aside class="hidden lg:block">
      <div v-if="selected" class="sketch-card tape sticky top-28 rotate-[0.4deg] px-7 py-7">
        <ActivityDetail :item="selected" :viewer="viewer" />
      </div>
    </aside>

    <UModal v-model:open="modalOpen" title="Details">
      <template #body>
        <ActivityDetail v-if="selected" :item="selected" :viewer="viewer" />
      </template>
    </UModal>
  </div>
</template>
