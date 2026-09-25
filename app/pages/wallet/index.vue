<script setup lang="ts">
definePageMeta({ title: "Wallet", subtitle: "good to see you again ♡" });

const smart = useSmartAccounts();
const activity = useActivity();
const faucet = useFaucet();
const modal = useAccountModal();
const isDev = import.meta.dev;

const account = computed(() => smart.active.value!);
const items = computed(() => activity.forAccount(account.value.address));
const balance = computed(() => smart.activeBalance.value);
const [whole, frac] = [
  computed(() =>
    balance.value === undefined ? "…" : formatAmount(balance.value, 18, 4, 4).split(".")[0],
  ),
  computed(() =>
    balance.value === undefined ? "" : formatAmount(balance.value, 18, 4, 4).split(".")[1],
  ),
];
</script>

<template>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
    <!-- Left: balance, actions, accounts -->
    <div class="flex flex-col gap-6">
      <section class="lg:sketch-card lg:px-8 lg:py-7">
        <div class="flex items-center gap-3">
          <p class="hand text-[17px] text-ink-soft">Balance</p>
          <UTooltip
            :text="
              smart.activeDeployed.value
                ? 'The smart account contract exists on-chain.'
                : 'Counterfactual: the address is known, the contract is created by your first transaction.'
            "
          >
            <span
              class="hand rounded-full border-[1.2px] px-2 text-[12px]"
              :class="
                smart.activeDeployed.value
                  ? 'border-accent text-accent'
                  : 'border-warn-dot bg-sticky text-on-sticky'
              "
            >
              {{ smart.activeDeployed.value ? "deployed" : "not deployed yet" }}
            </span>
          </UTooltip>
        </div>
        <UTooltip :text="balance !== undefined ? `${formatFull(balance)} ETH` : ''">
          <p
            class="num relative mt-1 inline-flex max-w-full flex-wrap items-baseline gap-x-2 font-semibold"
          >
            <span class="text-[clamp(38px,13vw,56px)] leading-none lg:text-[76px]"
              >{{ whole }}<span v-if="frac">.{{ frac }}</span></span
            >
            <span class="text-2xl font-medium text-ink-soft lg:text-3xl">ETH</span>
            <Doodle kind="underline" class="absolute -bottom-3 left-0 h-3 w-[88%] text-heart" />
          </p>
        </UTooltip>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <AddressChip :address="account.address" />
          <span class="scribble flex items-center gap-1 text-xl text-pen">
            <Doodle kind="arrow-back" class="h-5 w-7" /> tap to copy
          </span>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-4">
        <NuxtLink to="/wallet/send" class="btn btn-primary h-14 text-[19px]">
          <span class="grid size-7 place-items-center rounded-full bg-on-btn/15"
            ><UIcon name="i-lucide-arrow-up-right" class="size-4"
          /></span>
          Send
        </NuxtLink>
        <NuxtLink to="/wallet/receive" class="btn btn-outline h-14 text-[19px]">
          <span class="grid size-7 place-items-center rounded-full bg-paper-deep"
            ><UIcon name="i-lucide-arrow-down-left" class="size-4"
          /></span>
          Receive
        </NuxtLink>
      </div>
      <div class="-mt-1 flex flex-wrap gap-2">
        <NuxtLink to="/wallet/tokens" class="pill"
          ><UIcon name="i-lucide-coins" class="size-4" />Tokens</NuxtLink
        >
        <NuxtLink to="/wallet/batch" class="pill"
          ><UIcon name="i-lucide-layers" class="size-4" />Batch</NuxtLink
        >
        <NuxtLink to="/wallet/sign" class="pill"
          ><UIcon name="i-lucide-pen-line" class="size-4" />Sign</NuxtLink
        >
        <button
          v-if="isDev"
          type="button"
          class="pill pill-active"
          :disabled="faucet.busy.value"
          @click="faucet.fund(account.address)"
        >
          <UIcon
            :name="faucet.busy.value ? 'i-lucide-loader-circle' : 'i-lucide-droplet'"
            class="size-4"
            :class="{ 'animate-spin': faucet.busy.value }"
          />
          Fund me
        </button>
      </div>

      <div
        v-if="!smart.activeDeployed.value && (balance ?? 0n) === 0n"
        class="sticky-note tape rotate-[-0.6deg]"
      >
        <p class="hand">Do this first!</p>
        <p class="text-[13px]">
          Your account pays its own gas. Tap <b>Fund me</b> to get 100 local ETH, then your first
          send also deploys the account.
        </p>
      </div>

      <!-- Your accounts (desktop) -->
      <section class="hidden lg:block">
        <div class="mb-3 flex items-end justify-between">
          <h2 class="hand text-[20px]">Your accounts</h2>
          <span class="scribble text-lg text-pen">all under one passkey</span>
        </div>
        <div class="sketch-card ruled px-5">
          <button
            v-for="acc in smart.accounts.value"
            :key="acc.index"
            type="button"
            class="flex w-full items-center gap-3 py-3.5 text-left"
            @click="smart.setActive(acc.index)"
          >
            <AccountAvatar :index="acc.index" :size="36" />
            <span class="min-w-0 flex-1">
              <span class="hand block text-[16px]">{{ acc.label }}</span>
              <span class="block font-mono text-[11.5px] text-ink-soft">{{
                shortAddress(acc.address)
              }}</span>
            </span>
            <AmountText
              :value="smart.balances.value[acc.address]"
              :max="4"
              :min="4"
              class="text-[15px] font-medium"
            />
            <span
              v-if="acc.index === account.index"
              class="hand ml-1 rounded-full border-[1.2px] border-sketch bg-sticky px-2 text-[12px] text-on-sticky"
              >in use</span
            >
          </button>
          <button
            type="button"
            class="hand flex w-full items-center gap-2 py-3 text-[15px] text-ink-soft hover:text-ink"
            @click="modal.openAdd()"
          >
            <UIcon name="i-lucide-plus" class="size-4" /> Add account
          </button>
        </div>
      </section>
    </div>

    <!-- Right: recent activity -->
    <section class="lg:sketch-card lg:self-start lg:px-7 lg:py-6">
      <div class="mb-2 flex items-end justify-between">
        <ScribbleHeading class="text-[20px] lg:text-[22px]">Recent activity</ScribbleHeading>
        <NuxtLink to="/wallet/activity" class="scribble flex items-center gap-1 text-xl text-pen">
          see all <UIcon name="i-lucide-arrow-right" class="size-4" />
        </NuxtLink>
      </div>
      <ActivityFeed
        class="mt-4"
        :items="items"
        :viewer="account.address"
        :limit="6"
        :grouped="true"
        @select="(i) => navigateTo({ path: '/wallet/activity', query: { id: i.id } })"
      />
    </section>
  </div>
</template>
