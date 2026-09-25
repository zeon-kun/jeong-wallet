<script setup lang="ts">
defineProps<{ status: ActivityStatus }>();
</script>

<template>
  <span v-if="status === 'pending'" class="hand relative inline-block px-1.5 text-[12px] text-warn">
    Pending
    <Doodle
      kind="circle"
      class="pointer-events-none absolute -inset-x-1 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+8px)] text-warn-dot"
    />
  </span>
  <span v-else-if="status === 'failed'" class="hand text-[12px] text-danger">Failed</span>
  <span v-else class="hand text-[12px] text-ink-soft">Confirmed</span>
</template>
