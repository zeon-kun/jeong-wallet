<script setup lang="ts">
withDefaults(defineProps<{ tag?: string; underline?: boolean }>(), { tag: "h2", underline: true });
</script>

<template>
  <component :is="tag" class="hand relative inline-block text-ink">
    <slot />
    <Doodle
      v-if="underline"
      kind="underline"
      class="absolute -bottom-2 left-0 h-2 w-full text-heart"
    />
  </component>
</template>
