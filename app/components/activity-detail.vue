<script setup lang="ts">
import type { Address } from "viem";

const props = defineProps<{ item: ActivityItem; viewer: Address }>();
const smart = useSmartAccounts();
const view = computed(() =>
  describeActivity(props.item, props.viewer, (a) => smart.findByAddress(a)?.label),
);
const when = computed(
  () => `${dayLabel(props.item.createdAt).toLowerCase()}, ${clockTime(props.item.createdAt)}`,
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="hand text-xl text-ink-soft">{{ view.title }}</p>
        <p class="num text-[40px] leading-tight font-semibold">
          <AmountText
            v-if="view.amount"
            :value="view.amount.value"
            :decimals="view.amount.decimals"
            :symbol="view.amount.symbol"
          />
          <span v-else-if="item.kind === 'batch'">{{ item.calls?.length }} calls</span>
          <span v-else>—</span>
        </p>
        <p class="text-sm text-ink-soft">{{ view.subtitle }} · {{ when }}</p>
      </div>
      <Doodle
        :kind="item.status === 'failed' ? 'cross' : 'check'"
        class="h-16 w-20 shrink-0"
        :class="
          item.status === 'failed'
            ? 'text-danger'
            : item.status === 'pending'
              ? 'text-warn-dot'
              : 'text-accent'
        "
      />
    </div>

    <div v-if="item.calls?.length" class="sketch-card ruled px-4 py-1">
      <div
        v-for="(c, i) in item.calls"
        :key="i"
        class="flex items-center justify-between gap-3 py-2 text-sm"
      >
        <span class="hand text-ink-soft"
          >#{{ i + 1 }} → {{ smart.findByAddress(c.to)?.label ?? shortAddress(c.to) }}</span
        >
        <AmountText
          v-if="c.token"
          :value="c.token.amount"
          :decimals="c.token.decimals"
          :symbol="c.token.symbol"
        />
        <AmountText v-else :value="c.value ?? '0'" />
      </div>
    </div>

    <dl class="sketch-card flex flex-col gap-3 px-4 py-4 text-sm">
      <div class="flex items-center justify-between">
        <dt class="text-ink-soft">Status</dt>
        <dd
          class="hand flex items-center gap-1.5"
          :class="
            item.status === 'failed'
              ? 'text-danger'
              : item.status === 'pending'
                ? 'text-warn'
                : 'text-accent'
          "
        >
          <span class="size-2 rounded-full bg-current" />
          {{
            item.status === "success"
              ? "Confirmed"
              : item.status === "pending"
                ? "Pending"
                : "Failed"
          }}
        </dd>
      </div>
      <div v-if="item.error" class="text-[13px] text-danger">{{ item.error }}</div>
      <div v-if="item.fee" class="flex items-center justify-between">
        <dt class="text-ink-soft">Network fee</dt>
        <dd><AmountText :value="item.fee" /></dd>
      </div>
      <div v-if="item.blockNumber" class="flex items-center justify-between">
        <dt class="text-ink-soft">Block</dt>
        <dd class="font-mono">#{{ Number(item.blockNumber).toLocaleString() }}</dd>
      </div>
      <div v-if="item.txHash" class="flex items-center justify-between">
        <dt class="text-ink-soft">Tx hash</dt>
        <dd><AddressChip :address="item.txHash" bare /></dd>
      </div>
      <div v-if="item.userOpHash" class="flex items-center justify-between">
        <dt class="text-ink-soft">UserOp hash</dt>
        <dd><AddressChip :address="item.userOpHash" bare /></dd>
      </div>
      <div v-if="item.to" class="flex items-center justify-between">
        <dt class="text-ink-soft">{{ view.incoming ? "From" : "To" }}</dt>
        <dd><AddressChip :address="view.incoming ? item.account : item.to" bare /></dd>
      </div>
    </dl>

    <p
      v-if="item.userOpHash"
      class="scribble flex items-start justify-end gap-2 text-right text-xl text-pen"
    >
      <Doodle kind="arrow-down" class="mt-1 size-7 -scale-x-100 rotate-[-60deg]" />
      UserOp hash = your<br />smart account's receipt
    </p>
  </div>
</template>
