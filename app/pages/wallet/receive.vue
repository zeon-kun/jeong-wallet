<script setup lang="ts">
definePageMeta({ title: "Receive", subtitle: "share this page with a friend", back: "/wallet" });

const smart = useSmartAccounts();
const { copy } = useCopy();
const account = computed(() => smart.active.value!);
const halves = computed(() => [
  account.value.address.slice(0, 22),
  account.value.address.slice(22),
]);

async function share() {
  if (navigator.share) {
    try {
      await navigator.share({ title: "My Jeong Wallet address", text: account.value.address });
      return;
    } catch {}
  }
  copy(account.value.address, "Address copied");
}
</script>

<template>
  <div
    class="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14"
  >
    <section class="flex flex-col items-center">
      <p class="hand mb-4 flex items-center gap-2 text-[15px]">
        <AccountAvatar :index="account.index" :size="24" /> {{ account.label }}
      </p>
      <div class="relative w-full max-w-[380px]">
        <span class="scribble absolute top-10 -left-14 hidden text-xl text-pen sm:block">
          scan<br />me!<Doodle kind="arrow-down" class="mt-1 size-6" />
        </span>
        <div
          class="tape relative rotate-[1.5deg] rounded-[10px] border-[1.6px] border-sketch bg-white p-6 shadow-[4px_5px_0_var(--jw-shadow)]"
        >
          <QrCode :value="account.address" />
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-6">
      <div class="sketch-card px-6 py-6">
        <div class="mb-4 flex items-end justify-between">
          <ScribbleHeading class="text-[20px]">Your address</ScribbleHeading>
          <span class="scribble hidden items-center gap-1 text-lg text-pen lg:flex"
            >tap to copy <Doodle kind="arrow-down" class="size-5 -rotate-12"
          /></span>
        </div>
        <button
          type="button"
          class="w-full rounded-xl bg-paper-deep px-4 py-3.5 text-left font-mono text-[15px] leading-relaxed break-all lg:text-[19px]"
          @click="copy(account.address, 'Address copied')"
        >
          {{ halves[0] }}<br class="hidden lg:block" />{{ halves[1] }}
        </button>
        <div class="mt-5 grid grid-cols-2 gap-3">
          <button type="button" class="btn btn-outline" @click="share">
            <UIcon name="i-lucide-share-2" class="size-5" />Share
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="copy(account.address, 'Address copied')"
          >
            <UIcon name="i-lucide-copy" class="size-5" />Copy address
          </button>
        </div>
      </div>
      <div class="sticky-note tape rotate-[-0.6deg]">
        <p class="hand">Local fork only!</p>
        <p class="text-[13px]">
          Only send ETH on the Local fork (chain {{ CHAIN_ID }}). Funds sent from other networks
          won't arrive.
        </p>
      </div>
      <p v-if="!smart.activeDeployed.value" class="scribble text-lg text-pen">
        psst — the account isn't deployed yet, but it can already receive ETH at this address.
      </p>
    </section>
  </div>
</template>
