<script setup lang="ts">
// Hand-drawn marks from the Notebook Kit. Color comes from `class` (text-heart, text-pen, ...).
defineProps<{
  kind: "underline" | "circle" | "arrow" | "arrow-back" | "arrow-down" | "check" | "cross";
}>();
</script>

<template>
  <svg
    v-if="kind === 'underline'"
    viewBox="0 0 120 10"
    preserveAspectRatio="none"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M2 4.2c20-1.6 60-2.6 116-1.4" />
    <path d="M9 8.1c26-2 58-2.6 96-2" opacity=".85" />
  </svg>
  <svg
    v-else-if="kind === 'circle'"
    viewBox="0 0 110 50"
    preserveAspectRatio="none"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path
      d="M60 3.5C32 1.5 4 9 3.5 24c-.5 14 24 22.5 52 22 29-.5 51-9.5 50.5-23C105.5 10 82 2.5 52 4.5"
    />
  </svg>
  <svg
    v-else-if="kind === 'arrow'"
    viewBox="0 0 60 36"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M3 32C12 14 29 6 55 8" />
    <path d="M45 2.5 55.5 8 46 14.5" />
  </svg>
  <svg
    v-else-if="kind === 'arrow-back'"
    viewBox="0 0 44 30"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M41 27C36 13 24 6 5 9" />
    <path d="M13 3 4.5 9 12.5 15.5" />
  </svg>
  <svg
    v-else-if="kind === 'arrow-down'"
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4 4c1 17 13 28 31 30" />
    <path d="M26 27.5 35 34l-9.5 5" />
  </svg>
  <svg
    v-else-if="kind === 'check'"
    viewBox="0 0 120 100"
    fill="none"
    stroke="currentColor"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M66 5C33 2 6 20 5 48c-1 27 25 47 57 46 32-1 53-20 53-46C115 24 94 6 62 7.5" />
    <path d="M40 50 55 63 83 33" stroke-width="3.2" />
  </svg>
  <svg
    v-else
    viewBox="0 0 120 100"
    fill="none"
    stroke="currentColor"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M66 5C33 2 6 20 5 48c-1 27 25 47 57 46 32-1 53-20 53-46C115 24 94 6 62 7.5" />
    <path d="M45 35 76 66M76 35 45 66" stroke-width="3.2" />
  </svg>
</template>
