<script setup lang="ts">
import QRCode from "qrcode";

// QR with the heart mark in the middle (high error correction leaves room for it).
const props = defineProps<{ value: string }>();
const svg = ref("");
watchEffect(async () => {
  svg.value = await QRCode.toString(props.value, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#111318", light: "#ffffff" },
  });
});
</script>

<template>
  <div class="relative aspect-square w-full">
    <div class="size-full [&>svg]:size-full" v-html="svg" />
    <div
      class="absolute top-1/2 left-1/2 grid size-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-white"
    >
      <AppLogo :size="44" class="text-[#E0533D]" />
    </div>
  </div>
</template>
