<script setup lang="ts">
withDefaults(defineProps<{ index?: number; size?: number }>(), { index: 0, size: 32 });
</script>

<template>
  <img
    :src="avatarFor(index)"
    :width="size"
    :height="size"
    alt=""
    class="shrink-0 rounded-full border-[1.5px] border-sketch bg-paper-deep object-cover"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>
