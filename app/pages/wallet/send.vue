<script setup lang="ts">
import { parseUnits, type Address } from "viem";
import { useDebounceFn, useMediaQuery } from "@vueuse/core";

definePageMeta({ title: "Send", subtitle: "check twice, send once", back: "/wallet" });

const route = useRoute();
const smart = useSmartAccounts();
const token = useToken();
const sender = useSend();
const isDesktop = useMediaQuery("(min-width: 1024px)");

type Asset = "eth" | "token";
const asset = ref<Asset>(route.query.asset === "token" ? "token" : "eth");
const toInput = ref(typeof route.query.to === "string" ? route.query.to : "");
const amountInput = ref("");
const step = ref<"form" | "review" | "result">("form");
const result = ref<ActivityItem & { deployed?: boolean }>();

onMounted(() => token.load());

const recipient = useRecipient(toInput);
const isEth = computed(() => asset.value === "eth" || !token.token.value);
const decimals = computed(() => (isEth.value ? 18 : token.token.value!.decimals));
const symbol = computed(() => (isEth.value ? "ETH" : token.token.value!.symbol));
const presets = computed(() =>
  isEth.value ? ["0.1", "0.25", "0.5", "1"] : ["10", "100", "250", "1000"],
);
const ethBalance = computed(() => smart.activeBalance.value ?? 0n);
const available = computed(() =>
  isEth.value ? ethBalance.value : (token.balances.value[smart.active.value!.address] ?? 0n),
);
const otherAccounts = computed(() =>
  smart.accounts.value.filter((a) => a.index !== smart.active.value?.index),
);

const amount = computed<bigint | undefined>(() => {
  const v = amountInput.value.trim().replace(",", ".");
  if (!v || !/^\d*\.?\d*$/.test(v)) return undefined;
  try {
    return parseUnits(v, decimals.value);
  } catch {
    return undefined;
  }
});

// Fee estimate (no passkey prompt: the stub signature is used)
const estimate = ref<FeeEstimate>();
const estimateError = ref<string>();
const runEstimate = useDebounceFn(async () => {
  const to =
    recipient.value.state === "valid" ? recipient.value.address : smart.active.value!.address;
  try {
    // Estimate the same shape of call with a zero amount, so it works before the amount is valid.
    const probe = isEth.value ? [{ to, value: 0n }] : [token.transferCall(to, 0n)];
    estimate.value = await sender.estimate(probe);
    estimateError.value = undefined;
  } catch (e) {
    estimate.value = undefined;
    estimateError.value = humanizeError(e);
  }
}, 350);
watch(
  [
    () => recipient.value.state,
    isEth,
    () => smart.active.value?.index,
    () => smart.activeDeployed.value,
  ],
  runEstimate,
  {
    immediate: true,
  },
);

const fee = computed(() => estimate.value?.fee);
const maxSendable = computed(() => {
  if (!isEth.value) return available.value;
  if (fee.value === undefined) return undefined;
  const m = ethBalance.value - (fee.value * 12n) / 10n; // keep 20% headroom on the fee
  return m > 0n ? m : 0n;
});
function setMax() {
  if (maxSendable.value === undefined) return;
  amountInput.value = formatFull(maxSendable.value, decimals.value);
}

const amountError = computed(() => {
  if (!amountInput.value) return undefined;
  if (amount.value === undefined) return "Enter a number.";
  if (amount.value <= 0n) return "Amount must be more than 0.";
  if (amount.value > available.value)
    return `More than you have (${formatAmount(available.value, decimals.value)} ${symbol.value}).`;
  if (isEth.value && fee.value !== undefined && amount.value + fee.value > ethBalance.value)
    return "Leave some ETH for the network fee (try Max).";
  if (!isEth.value && fee.value !== undefined && fee.value > ethBalance.value)
    return "You need a little ETH for the network fee.";
  return undefined;
});

const canReview = computed(
  () =>
    recipient.value.state === "valid" &&
    amount.value !== undefined &&
    amount.value > 0n &&
    !amountError.value,
);
const toLabel = computed(() =>
  recipient.value.state === "valid" ? recipient.value.own?.label : undefined,
);

function buildCalls() {
  const to = (recipient.value as { address: Address }).address;
  return isEth.value ? [{ to, value: amount.value! }] : [token.transferCall(to, amount.value!)];
}

async function confirm() {
  if (!canReview.value) return;
  const to = (recipient.value as { address: Address }).address;
  step.value = "result";
  try {
    result.value = await sender.send(
      buildCalls(),
      isEth.value
        ? { kind: "send-eth", to, value: amount.value!.toString() }
        : {
            kind: "send-token",
            to,
            token: {
              address: token.token.value!.address,
              symbol: symbol.value,
              decimals: decimals.value,
              amount: amount.value!.toString(),
            },
          },
    );
  } catch {
    // sender.error has the readable message; the result card shows it
  }
}

function edit() {
  sender.reset();
  step.value = "form";
}
function done() {
  sender.reset();
  amountInput.value = "";
  toInput.value = "";
  result.value = undefined;
  step.value = "form";
  navigateTo("/wallet");
}
const amountLabel = computed(() =>
  amount.value !== undefined ? `${formatAmount(amount.value, decimals.value)} ${symbol.value}` : "",
);
const showForm = computed(() => isDesktop.value || step.value === "form");
const showSide = computed(() => isDesktop.value || step.value !== "form");
</script>

<template>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-10">
    <!-- Form -->
    <section
      v-if="showForm"
      class="flex flex-col gap-6 lg:sketch-card lg:px-8 lg:py-7"
      :class="{ 'pointer-events-none opacity-60': isDesktop && step === 'result' }"
    >
      <ScribbleHeading class="hidden text-[22px] lg:inline-block lg:self-start"
        >Who &amp; how much</ScribbleHeading
      >

      <div class="sketch-card flex items-center gap-3 px-4 py-3">
        <AccountAvatar :index="smart.active.value!.index" :size="36" />
        <div class="flex-1">
          <p class="hand text-[12px] text-ink-soft">From</p>
          <p class="hand text-[16px]">{{ smart.active.value!.label }}</p>
        </div>
        <div class="text-right">
          <p class="hand text-[12px] text-ink-soft">Available</p>
          <AmountText
            :value="available"
            :decimals="decimals"
            :symbol="symbol"
            :max="4"
            class="text-[15px] font-medium"
          />
        </div>
      </div>

      <div v-if="token.token.value" class="flex gap-2" role="radiogroup" aria-label="Asset">
        <button type="button" class="pill" :aria-pressed="asset === 'eth'" @click="asset = 'eth'">
          ETH
        </button>
        <button
          type="button"
          class="pill"
          :aria-pressed="asset === 'token'"
          @click="asset = 'token'"
        >
          {{ token.token.value.symbol }}
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-end justify-between">
          <label for="to" class="label">To</label>
          <span class="scribble flex items-center gap-1 text-xl text-pen"
            >double-check this! <Doodle kind="arrow-down" class="size-5 -rotate-12"
          /></span>
        </div>
        <div class="relative">
          <input
            id="to"
            v-model="toInput"
            class="sketch-input pr-10 font-mono text-[13.5px]"
            placeholder="0x…"
            spellcheck="false"
            autocomplete="off"
            :aria-invalid="recipient.state === 'invalid' || recipient.state === 'self'"
          />
          <button
            v-if="toInput"
            type="button"
            class="absolute top-1/2 right-3 -translate-y-1/2 text-ink-soft"
            aria-label="Clear"
            @click="toInput = ''"
          >
            <UIcon name="i-lucide-circle-x" class="size-5" />
          </button>
        </div>
        <p
          v-if="recipient.state !== 'empty'"
          class="flex items-center gap-1.5 text-[13px]"
          :class="recipient.state === 'valid' ? 'text-accent' : 'text-danger'"
        >
          <UIcon
            :name="recipient.state === 'valid' ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
            class="size-4"
          />
          {{ recipient.message }}
        </p>
        <div v-if="otherAccounts.length" class="flex flex-wrap items-center gap-2 pt-1">
          <span class="scribble text-lg text-ink-soft">my accounts:</span>
          <button
            v-for="a in otherAccounts"
            :key="a.index"
            type="button"
            class="pill py-0.5! text-[14px]"
            @click="toInput = a.address"
          >
            <AccountAvatar :index="a.index" :size="18" /> {{ a.label }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-end justify-between">
          <label for="amount" class="label">Amount</label>
          <span v-if="maxSendable !== undefined" class="text-[12.5px] text-ink-soft">
            Max {{ formatAmount(maxSendable, decimals, 4) }} {{ symbol
            }}{{ isEth ? " after fee" : "" }}
          </span>
        </div>
        <div class="sketch-card px-4 pt-3 pb-4" :class="{ 'border-danger!': amountError }">
          <div class="flex items-center gap-2">
            <input
              id="amount"
              v-model="amountInput"
              inputmode="decimal"
              placeholder="0"
              class="num w-full min-w-0 bg-transparent text-[44px] leading-tight font-semibold outline-none placeholder:text-pencil"
              autocomplete="off"
            />
            <span class="text-xl font-medium text-ink-soft">{{ symbol }}</span>
            <button
              type="button"
              class="hand ml-2 rounded-lg border-[1.4px] border-sketch bg-highlight px-3 py-1 text-[14px] text-on-sticky"
              @click="setMax"
            >
              Max
            </button>
          </div>
          <div class="mt-3 grid grid-cols-4 gap-2">
            <button
              v-for="p in presets"
              :key="p"
              type="button"
              class="num rounded-[9px_11px_8px_10px] border-[1.4px] border-sketch py-1.5 text-[14px] font-medium transition"
              :class="amountInput === p ? 'bg-btn text-on-btn' : 'bg-card hover:bg-paper-deep'"
              @click="amountInput = p"
            >
              {{ p }}
            </button>
          </div>
        </div>
        <p v-if="amountError" class="flex items-center gap-1.5 text-[13px] text-danger">
          <UIcon name="i-lucide-circle-alert" class="size-4" /> {{ amountError }}
        </p>
      </div>

      <div class="flex items-center justify-between text-[14px] text-ink-soft">
        <span class="flex items-center gap-2"
          ><UIcon name="i-lucide-fuel" class="size-4" />Estimated network fee</span
        >
        <span v-if="estimateError" class="text-danger">{{ estimateError }}</span>
        <span v-else-if="fee !== undefined" class="text-ink">~<AmountText :value="fee" /></span>
        <UIcon v-else name="i-lucide-loader-circle" class="size-4 animate-spin" />
      </div>
      <p v-if="estimate?.deploys" class="scribble -mt-3 text-lg text-pen">
        ✦ this first transaction also creates your account
      </p>

      <button
        type="button"
        class="btn btn-primary mt-4 w-full lg:hidden"
        :disabled="!canReview"
        @click="step = 'review'"
      >
        Review
      </button>
    </section>

    <!-- Review / Result -->
    <section v-if="showSide" class="lg:self-start">
      <div class="lg:sketch-card relative lg:tape lg:rotate-[0.3deg] lg:px-8 lg:py-7">
        <template v-if="step !== 'result'">
          <div class="mb-5 hidden items-center justify-between lg:flex">
            <h2 class="hand text-[22px]">Review</h2>
            <span class="scribble flex items-center gap-1 text-lg text-pen"
              ><UIcon name="i-lucide-arrow-left" class="size-4" /> updates as you type</span
            >
          </div>
          <SendReview
            :amount="amount ?? 0n"
            :decimals="decimals"
            :symbol="symbol"
            :to="recipient.state === 'valid' ? recipient.address : undefined"
            :to-label="toLabel"
            :fee="fee"
            :fee-error="estimateError"
            :deploys="estimate?.deploys"
            :is-eth="isEth"
          />
          <p class="scribble mt-8 flex items-center justify-center gap-2 text-xl text-pen">
            <UIcon name="i-lucide-shield-check" class="size-4" /> you'll approve this with your
            passkey ♡
          </p>
          <button
            type="button"
            class="btn btn-primary mt-3 w-full"
            :disabled="!canReview"
            @click="confirm"
          >
            <UIcon name="i-lucide-key-round" class="size-5" /> Confirm and send
          </button>
          <button type="button" class="btn btn-ghost mt-2 w-full lg:hidden" @click="step = 'form'">
            Cancel
          </button>
        </template>
        <SendResult
          v-else
          :phase="sender.phase.value"
          :error="sender.error.value"
          :item="result"
          :amount-label="amountLabel"
          :to="toLabel ?? shortAddress(recipient.state === 'valid' ? recipient.address : '')"
          @retry="confirm"
          @edit="edit"
          @done="done"
        />
      </div>
    </section>
  </div>
</template>
