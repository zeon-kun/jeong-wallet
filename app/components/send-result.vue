<script setup lang="ts">
// Outcome of a UserOp: waiting states, success receipt, or a readable error.
defineProps<{
  phase: SendPhase;
  error?: string;
  item?: ActivityItem & { deployed?: boolean };
  amountLabel: string;
  to?: string;
}>();
defineEmits<{ retry: []; edit: []; done: [] }>();
</script>

<template>
  <div class="flex flex-col items-center gap-5 text-center">
    <template v-if="phase === 'signing' || phase === 'bundling'">
      <div class="relative grid size-28 place-items-center">
        <Doodle kind="circle" class="absolute inset-0 size-full animate-pulse text-pen" />
        <UIcon
          :name="phase === 'signing' ? 'i-lucide-fingerprint' : 'i-lucide-package'"
          class="size-10 text-ink"
        />
      </div>
      <div>
        <p class="hand text-2xl">
          {{ phase === "signing" ? "Approve with your passkey" : "Bundling…" }}
        </p>
        <p class="mt-1 text-[14px] text-ink-soft">
          {{
            phase === "signing"
              ? "Your device will ask for your fingerprint, face or PIN."
              : "The bundler is simulating and submitting your UserOp to the EntryPoint."
          }}
        </p>
      </div>
    </template>

    <template v-else-if="phase === 'done' && item">
      <Doodle kind="check" class="h-28 w-32 text-accent" />
      <div>
        <p class="num text-[30px] font-semibold">{{ amountLabel }} sent</p>
        <p class="text-[14px] text-ink-soft">
          to {{ to
          }}<template v-if="item.blockNumber">
            · confirmed in block #{{ Number(item.blockNumber).toLocaleString() }}</template
          >
        </p>
      </div>
      <div class="sketch-card tape relative w-full rotate-[0.4deg] px-5 py-4 text-left text-[14px]">
        <dl class="flex flex-col gap-3">
          <div class="flex justify-between">
            <dt class="text-ink-soft">Status</dt>
            <dd class="hand flex items-center gap-1.5 text-accent">
              <span class="size-2 rounded-full bg-current" />Confirmed
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-soft">Network fee</dt>
            <dd><AmountText :value="item.fee ?? '0'" /></dd>
          </div>
          <div v-if="item.txHash" class="flex justify-between">
            <dt class="text-ink-soft">Tx hash</dt>
            <dd><AddressChip :address="item.txHash" bare /></dd>
          </div>
          <div v-if="item.userOpHash" class="flex justify-between">
            <dt class="text-ink-soft">UserOp hash</dt>
            <dd><AddressChip :address="item.userOpHash" bare /></dd>
          </div>
        </dl>
      </div>
      <p v-if="item.deployed" class="scribble text-xl text-pen">
        …and your account now exists on-chain ✦
      </p>
      <div class="flex w-full flex-col gap-2 pt-2">
        <button type="button" class="btn btn-primary w-full" @click="$emit('done')">Done</button>
        <NuxtLink
          :to="{ path: '/wallet/activity', query: { id: item.id } }"
          class="btn btn-ghost w-full"
        >
          <UIcon name="i-lucide-history" class="size-5" /> View in activity
        </NuxtLink>
      </div>
    </template>

    <template v-else>
      <Doodle kind="cross" class="h-28 w-32 text-danger" />
      <div>
        <p class="hand text-2xl">Not sent</p>
        <p class="mt-1 text-[14px] text-ink-soft">{{ error }}</p>
      </div>
      <div class="grid w-full grid-cols-2 gap-3 pt-2">
        <button type="button" class="btn btn-outline" @click="$emit('edit')">Edit</button>
        <button type="button" class="btn btn-primary" @click="$emit('retry')">
          <UIcon name="i-lucide-rotate-ccw" class="size-4" /> Retry
        </button>
      </div>
    </template>
  </div>
</template>
