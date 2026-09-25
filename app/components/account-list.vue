<script setup lang="ts">
// Accounts sheet content: switch, rename, add. Shared by the desktop popover and the mobile drawer.
const emit = defineEmits<{ close: [] }>();
const smart = useSmartAccounts();
const modal = useAccountModal();

async function pick(index: number) {
  await smart.setActive(index);
  emit("close");
}
function rename(index: number) {
  emit("close");
  modal.openRename(index);
}
function add() {
  emit("close");
  modal.openAdd();
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 flex items-start justify-between gap-4">
      <div>
        <p class="hand text-xl">Accounts</p>
        <p class="text-[13px] text-ink-soft">All secured by the same passkey</p>
      </div>
    </div>
    <ul class="flex flex-col gap-1.5">
      <li v-for="acc in smart.accounts.value" :key="acc.index">
        <div
          class="group flex items-center gap-3 rounded-[12px_15px_11px_14px] border-[1.4px] px-3 py-2.5 transition"
          :class="
            acc.index === smart.active.value?.index
              ? 'border-sketch bg-highlight text-on-sticky'
              : 'border-transparent hover:bg-paper-deep'
          "
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="pick(acc.index)"
          >
            <AccountAvatar :index="acc.index" :size="36" />
            <span class="min-w-0 flex-1">
              <span class="hand block text-[16px] leading-tight break-words">{{ acc.label }}</span>
              <span class="block font-mono text-[11px] opacity-70">{{
                shortAddress(acc.address)
              }}</span>
            </span>
            <AmountText
              :value="smart.balances.value[acc.address]"
              :max="4"
              :min="4"
              class="text-sm"
            />
          </button>
          <span
            v-if="acc.index === smart.active.value?.index"
            class="grid size-6 place-items-center rounded-full bg-ink text-paper"
            aria-label="Active"
          >
            <UIcon name="i-lucide-check" class="size-3.5" />
          </span>
          <button
            v-else
            type="button"
            class="grid size-7 place-items-center rounded-full text-ink-soft hover:bg-card hover:text-ink"
            :aria-label="`Rename ${acc.label}`"
            @click="rename(acc.index)"
          >
            <UIcon name="i-lucide-pencil" class="size-4" />
          </button>
        </div>
      </li>
    </ul>
    <button
      type="button"
      class="sketch-card mt-3 flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-paper-deep"
      @click="add"
    >
      <span
        class="grid size-9 place-items-center rounded-full border-[1.5px] border-sketch bg-highlight text-on-sticky"
      >
        <UIcon name="i-lucide-plus" class="size-4" />
      </span>
      <span>
        <span class="hand block text-[16px]">Add account</span>
        <span class="block text-[12px] text-ink-soft">New smart account, same passkey</span>
      </span>
    </button>
  </div>
</template>
