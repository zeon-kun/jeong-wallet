<script setup lang="ts">
// Wallet shell. Mobile: header + content column (max 480px) + bottom tabs.
// Desktop (>= lg): notebook sidebar + top bar + wide main area with a red margin line.
const route = useRoute();
const smart = useSmartAccounts();
useChainPoller();

const nav = [
  { to: "/wallet", label: "Wallet", icon: "i-lucide-wallet" },
  { to: "/wallet/send", label: "Send", icon: "i-lucide-arrow-up-right" },
  { to: "/wallet/receive", label: "Receive", icon: "i-lucide-arrow-down-left" },
  { to: "/wallet/tokens", label: "Tokens", icon: "i-lucide-coins" },
  { to: "/wallet/sign", label: "Sign", icon: "i-lucide-pen-line" },
  { to: "/wallet/activity", label: "Activity", icon: "i-lucide-history" },
  { to: "/settings", label: "Settings", icon: "i-lucide-settings" },
];
const tabs = [
  { to: "/wallet", label: "Wallet", icon: "i-lucide-wallet" },
  { to: "/wallet/activity", label: "Activity", icon: "i-lucide-history" },
  { to: "/settings", label: "Settings", icon: "i-lucide-settings" },
];
const isActive = (to: string) =>
  to === "/wallet" ? route.path === "/wallet" : route.path.startsWith(to);

const title = computed(() => (route.meta.title as string) ?? "Wallet");
const subtitle = computed(() => route.meta.subtitle as string | undefined);
const back = computed(() => route.meta.back as string | undefined);

const colorMode = useColorMode();
const toggleColor = () => (colorMode.preference = colorMode.value === "dark" ? "light" : "dark");
</script>

<template>
  <div class="min-h-dvh bg-paper text-ink">
    <!-- Desktop sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-20 hidden w-[260px] border-r-2 border-sketch bg-paper-deep lg:flex"
    >
      <div class="flex min-w-0 flex-1 flex-col px-6 pt-7 pb-6">
        <NuxtLink to="/wallet" class="mb-10"><AppLogo lockup /></NuxtLink>
        <p class="scribble mb-2 text-lg text-pencil">my notebook</p>
        <nav class="flex flex-col gap-1.5">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="hand flex items-center gap-3.5 rounded-[12px_15px_11px_14px] border-[1.6px] px-4 py-2.5 text-[18px] transition"
            :class="
              isActive(item.to)
                ? 'border-sketch bg-highlight text-on-sticky'
                : 'border-transparent text-ink-soft hover:text-ink'
            "
            style="font-weight: 400"
            :style="isActive(item.to) ? 'font-weight: 700' : ''"
          >
            <UIcon :name="item.icon" class="size-5" />
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="mt-auto flex flex-col gap-5">
          <div class="sticky-note tape -rotate-2">
            <p class="hand mb-1 text-[17px]">Local fork</p>
            <p class="text-[13px] leading-snug">A safe sandbox — balances aren't real ETH.</p>
          </div>
          <NuxtLink
            to="/dev"
            class="scribble flex items-center gap-2 text-lg text-ink-soft hover:text-pen"
          >
            <UIcon name="i-lucide-key-round" class="size-4 text-heart" />
            unlocked with your passkey
          </NuxtLink>
        </div>
      </div>
      <div class="ring-holes w-5 shrink-0" aria-hidden="true" />
    </aside>

    <div class="lg:pl-[260px]">
      <!-- Desktop top bar -->
      <header
        class="sticky top-0 z-10 hidden items-center gap-4 border-b-[1.5px] border-rule bg-paper/95 py-4 pr-10 pl-[64px] backdrop-blur lg:flex margin-line"
      >
        <div class="min-w-0 flex-1">
          <h1 class="hand text-[30px] leading-none">{{ title }}</h1>
          <p v-if="subtitle" class="scribble mt-1 flex items-center gap-1 text-xl text-heart">
            {{ subtitle }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm size-10 p-0!"
          aria-label="Toggle dark mode"
          @click="toggleColor"
        >
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
            class="size-5"
          />
        </button>
        <AccountSwitcher />
        <NetworkBadge show-chain />
      </header>

      <!-- Mobile header -->
      <header
        class="sticky top-0 z-10 flex items-center gap-2 bg-paper/95 px-4 py-3 backdrop-blur lg:hidden"
      >
        <template v-if="back">
          <NuxtLink
            :to="back"
            class="grid size-10 place-items-center rounded-full border-[1.6px] border-sketch"
            aria-label="Back"
          >
            <UIcon name="i-lucide-arrow-left" class="size-5" />
          </NuxtLink>
          <h1 class="hand min-w-0 flex-1 truncate text-[20px]">{{ title }}</h1>
        </template>
        <div v-else class="min-w-0 flex-1"><AccountSwitcher /></div>
        <button
          type="button"
          class="grid size-9 place-items-center rounded-full"
          aria-label="Toggle dark mode"
          @click="toggleColor"
        >
          <UIcon
            :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
            class="size-4.5"
          />
        </button>
        <NetworkBadge />
      </header>

      <main
        class="lg:margin-line min-h-[calc(100dvh-104px)] px-4 pt-2 pb-32 lg:px-10 lg:pt-9 lg:pb-12 lg:pl-[64px]"
      >
        <div class="mx-auto w-full max-w-[480px] lg:max-w-[1180px]">
          <slot v-if="smart.active.value" />
          <div v-else class="grid place-items-center py-24">
            <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-pencil" />
          </div>
        </div>
      </main>
    </div>

    <!-- Mobile bottom tabs -->
    <nav
      class="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-[min(92vw,340px)] items-center justify-between rounded-[18px_22px_17px_20px] border-[1.6px] border-sketch bg-card p-1.5 shadow-[3px_4px_0_var(--jw-shadow)] lg:hidden"
    >
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="hand flex flex-1 flex-col items-center gap-0.5 rounded-[12px_15px_11px_14px] py-1.5 text-[12px]"
        :class="isActive(t.to) ? 'bg-highlight text-on-sticky' : 'text-ink-soft'"
      >
        <UIcon :name="t.icon" class="size-5" />
        {{ t.label }}
      </NuxtLink>
    </nav>

    <AccountFormModal />
  </div>
</template>
