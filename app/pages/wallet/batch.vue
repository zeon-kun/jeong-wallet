<script setup lang="ts">
import { parseUnits, type Address } from "viem";

definePageMeta({ title: "Batch", subtitle: "many calls, one signature", back: "/wallet/tokens" });

const smart = useSmartAccounts();
const token = useToken();
const sender = useSend();

interface Row {
  id: number;
  asset: "eth" | "token";
  to: string;
  amount: string;
}
let nextId = 1;
const rows = ref<Row[]>([]);
const step = ref<"build" | "review" | "result">("build");
const result = ref<ActivityItem>();
const estimate = ref<FeeEstimate>();
const estimateError = ref<string>();

onMounted(async () => {
  await token.load();
  demo();
});

function demo() {
  const other = smart.accounts.value.find((a) => a.index !== smart.active.value?.index);
  const to = other?.address ?? "";
  rows.value = [{ id: nextId++, asset: "eth", to, amount: "0.01" }];
  if (token.token.value) rows.value.push({ id: nextId++, asset: "token", to, amount: "10" });
}
const add = () => rows.value.push({ id: nextId++, asset: "eth", to: "", amount: "" });
const remove = (id: number) => (rows.value = rows.value.filter((r) => r.id !== id));

function parseRow(r: Row) {
  const decimals = r.asset === "eth" ? 18 : (token.token.value?.decimals ?? 6);
  const toOk = isHexAddress(r.to.trim());
  let amount: bigint | undefined;
  try {
    amount = /^\d*\.?\d+$/.test(r.amount.trim())
      ? parseUnits(r.amount.trim(), decimals)
      : undefined;
  } catch {}
  return { toOk, amount, decimals, valid: toOk && amount !== undefined && amount > 0n };
}
const allValid = computed(
  () => rows.value.length > 0 && rows.value.every((r) => parseRow(r).valid),
);

function buildCalls() {
  return rows.value.map((r) => {
    const { amount } = parseRow(r);
    const to = r.to.trim() as Address;
    return r.asset === "eth" ? { to, value: amount! } : token.transferCall(to, amount!);
  });
}
function recordCalls(): ActivityCall[] {
  const t = token.token.value;
  return rows.value.map((r) => {
    const { amount } = parseRow(r);
    const to = r.to.trim() as Address;
    return r.asset === "eth"
      ? { to, value: amount!.toString() }
      : {
          to,
          token: {
            address: t!.address,
            symbol: t!.symbol,
            decimals: t!.decimals,
            amount: amount!.toString(),
          },
        };
  });
}

async function review() {
  step.value = "review";
  estimate.value = undefined;
  estimateError.value = undefined;
  try {
    estimate.value = await sender.estimate(buildCalls());
  } catch (e) {
    estimateError.value = humanizeError(e);
  }
}
async function confirm() {
  step.value = "result";
  try {
    result.value = await sender.send(buildCalls(), { kind: "batch", calls: recordCalls() });
  } catch {}
}
const labelFor = (to: string) => smart.findByAddress(to)?.label ?? shortAddress(to);
</script>

<template>
  <div class="mx-auto max-w-[760px]">
    <!-- BUILD -->
    <section v-if="step === 'build'" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <ScribbleHeading class="text-[20px]">Calls</ScribbleHeading>
        <button type="button" class="scribble text-lg text-pen hover:underline" @click="demo">
          load demo: ETH + {{ token.token.value?.symbol ?? "token" }} to my other account
        </button>
      </div>
      <div v-for="(r, i) in rows" :key="r.id" class="sketch-card flex flex-col gap-3 px-4 py-4">
        <div class="flex items-center justify-between">
          <span class="hand text-[16px]">Call #{{ i + 1 }}</span>
          <button
            type="button"
            class="grid size-8 place-items-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-danger"
            :aria-label="`Remove call ${i + 1}`"
            @click="remove(r.id)"
          >
            <UIcon name="i-lucide-trash-2" class="size-4" />
          </button>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-[110px_minmax(0,1fr)_140px]">
          <select v-model="r.asset" class="sketch-input py-2! text-[14px]" aria-label="Asset">
            <option value="eth">ETH</option>
            <option v-if="token.token.value" value="token">{{ token.token.value.symbol }}</option>
          </select>
          <input
            v-model="r.to"
            class="sketch-input min-w-0 py-2! font-mono text-[12.5px]"
            placeholder="to 0x…"
            spellcheck="false"
            :aria-invalid="!!r.to && !parseRow(r).toOk"
            aria-label="Recipient"
          />
          <input
            v-model="r.amount"
            class="sketch-input py-2! text-[14px]"
            inputmode="decimal"
            placeholder="amount"
            aria-label="Amount"
          />
        </div>
        <div v-if="smart.accounts.value.length > 1" class="flex flex-wrap gap-1.5">
          <button
            v-for="a in smart.accounts.value.filter((x) => x.index !== smart.active.value?.index)"
            :key="a.index"
            type="button"
            class="pill py-0! text-[13px]"
            @click="r.to = a.address"
          >
            <AccountAvatar :index="a.index" :size="16" /> {{ a.label }}
          </button>
        </div>
      </div>
      <button type="button" class="btn btn-outline w-full border-dashed" @click="add">
        <UIcon name="i-lucide-plus" class="size-5" />Add call
      </button>
      <button type="button" class="btn btn-primary w-full" :disabled="!allValid" @click="review">
        Review {{ rows.length }} call{{ rows.length === 1 ? "" : "s" }}
      </button>
    </section>

    <!-- REVIEW -->
    <section v-else-if="step === 'review'" class="flex flex-col gap-5">
      <div class="sketch-card tape relative px-5 py-6">
        <h2 class="hand mb-4 text-xl">One UserOp, {{ rows.length }} calls</h2>
        <ol class="ruled">
          <li
            v-for="(r, i) in rows"
            :key="r.id"
            class="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]"
          >
            <span class="hand text-ink-soft">#{{ i + 1 }} → {{ labelFor(r.to) }}</span>
            <span class="font-semibold"
              >{{ r.amount }} {{ r.asset === "eth" ? "ETH" : token.token.value?.symbol }}</span
            >
          </li>
        </ol>
        <div class="mt-4 flex justify-between border-t-[1.2px] border-rule pt-3 text-[14px]">
          <span class="text-ink-soft">Network fee (max)</span>
          <span v-if="estimateError" class="text-danger">{{ estimateError }}</span>
          <AmountText v-else-if="estimate" :value="estimate.fee" />
          <UIcon v-else name="i-lucide-loader-circle" class="size-4 animate-spin" />
        </div>
      </div>
      <p class="scribble flex items-center justify-center gap-2 text-xl text-pen">
        <UIcon name="i-lucide-shield-check" class="size-4" />one passkey prompt for all of them ♡
      </p>
      <div class="grid grid-cols-2 gap-3">
        <button type="button" class="btn btn-outline" @click="step = 'build'">Edit</button>
        <button type="button" class="btn btn-primary" :disabled="!!estimateError" @click="confirm">
          <UIcon name="i-lucide-key-round" class="size-5" />Confirm
        </button>
      </div>
    </section>

    <!-- RESULT -->
    <section v-else class="mx-auto max-w-[480px]">
      <SendResult
        :phase="sender.phase.value"
        :error="sender.error.value"
        :item="result"
        :amount-label="`${rows.length} calls`"
        to="(batch)"
        @retry="confirm"
        @edit="(sender.reset(), (step = 'build'))"
        @done="navigateTo('/wallet')"
      />
    </section>
  </div>
</template>
