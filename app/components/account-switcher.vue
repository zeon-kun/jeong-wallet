<script setup lang="ts">
const smart = useSmartAccounts();
const popoverOpen = ref(false);
const drawerOpen = ref(false);
</script>

<template>
  <div v-if="smart.active.value">
    <!-- Desktop: popover with address line -->
    <div class="hidden lg:block">
      <UPopover v-model:open="popoverOpen" :content="{ align: 'end', sideOffset: 8 }">
        <button
          type="button"
          class="flex items-center gap-2.5 rounded-[14px_18px_13px_16px] border-[1.6px] border-sketch bg-card py-1.5 pr-3 pl-1.5 shadow-[3px_3px_0_var(--jw-shadow)] hover:bg-paper-deep"
        >
          <AccountAvatar :index="smart.active.value.index" :size="34" />
          <span class="text-left leading-tight">
            <span class="hand block text-[15px]">{{ smart.active.value.label }}</span>
            <span class="block font-mono text-[11px] text-ink-soft">{{
              shortAddress(smart.active.value.address)
            }}</span>
          </span>
          <UIcon name="i-lucide-chevron-down" class="ml-2 size-4" />
        </button>
        <template #content>
          <div class="w-[360px] p-4">
            <AccountList @close="popoverOpen = false" />
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Mobile: compact pill, bottom sheet -->
    <div class="lg:hidden">
      <UDrawer v-model:open="drawerOpen">
        <button
          type="button"
          class="flex items-center gap-2 rounded-full border-[1.4px] border-sketch bg-card py-1 pr-3 pl-1"
        >
          <AccountAvatar :index="smart.active.value.index" :size="26" />
          <span class="hand max-w-[150px] truncate text-[14px]">{{
            smart.active.value.label
          }}</span>
          <UIcon name="i-lucide-chevron-down" class="size-4" />
        </button>
        <template #content>
          <div class="mx-auto w-full max-w-[480px] p-4 pb-8">
            <AccountList @close="drawerOpen = false" />
          </div>
        </template>
      </UDrawer>
    </div>
  </div>
</template>
