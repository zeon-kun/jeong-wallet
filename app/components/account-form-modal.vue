<script setup lang="ts">
const smart = useSmartAccounts();
const modal = useAccountModal();
const toast = useToast();

const label = ref("");
const busy = ref(false);
const preview = ref<{ index: number; address: string }>();

const open = computed({
  get: () => modal.state.value.open,
  set: (v) => (v ? null : modal.close()),
});
const isAdd = computed(() => modal.state.value.mode === "add");
const target = computed(() =>
  smart.accounts.value.find((a) => a.index === modal.state.value.index),
);
const nextIndex = computed(() => Math.max(-1, ...smart.accounts.value.map((a) => a.index)) + 1);

watch(
  () => modal.state.value.open,
  async (isOpen) => {
    if (!isOpen) return;
    preview.value = undefined;
    label.value = isAdd.value ? "" : (target.value?.label ?? "");
    if (isAdd.value) {
      // Counterfactual address of the next index, computed before anything is deployed.
      const index = nextIndex.value;
      const account = await smart.getAccount(index);
      preview.value = { index, address: account.address };
    }
  },
);

async function submit() {
  const clean = label.value.trim();
  if (!clean) return;
  busy.value = true;
  try {
    if (isAdd.value) {
      const acc = await smart.createAccount(clean);
      await smart.setActive(acc.index);
      toast.add({
        title: `${acc.label} created`,
        description: shortAddress(acc.address),
        color: "success",
        icon: "i-lucide-sparkles",
      });
    } else if (target.value) {
      await smart.rename(target.value.index, clean);
      toast.add({ title: "Renamed", description: clean, color: "success" });
    }
    modal.close();
  } catch (e) {
    toast.add({ title: "Couldn't save", description: humanizeError(e), color: "error" });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isAdd ? 'Add account' : 'Rename account'"
    :description="
      isAdd
        ? 'Creates a new smart account controlled by your existing passkey. No new backup needed.'
        : 'Names are stored only on this device.'
    "
  >
    <template #body>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="sketch-card flex items-center gap-3 px-3 py-2.5">
          <AccountAvatar
            :index="isAdd ? (preview?.index ?? nextIndex) : (target?.index ?? 0)"
            :size="36"
          />
          <div class="min-w-0 flex-1">
            <p class="hand truncate text-[16px]">
              {{ label || (isAdd ? `Account ${nextIndex + 1}` : target?.label) }}
            </p>
            <p class="font-mono text-[11px] text-ink-soft">
              {{
                isAdd
                  ? preview
                    ? shortAddress(preview.address)
                    : "computing address…"
                  : shortAddress(target?.address)
              }}
            </p>
          </div>
          <span
            v-if="isAdd"
            class="hand rounded-full border-[1.2px] border-sketch bg-sticky px-2 text-[12px] text-on-sticky"
            >#{{ nextIndex + 1 }}</span
          >
        </div>
        <label class="flex flex-col gap-1.5">
          <span class="label text-sm">Account name</span>
          <span class="relative">
            <input
              v-model="label"
              class="sketch-input pr-14"
              :maxlength="ACCOUNT_LABEL_MAX"
              autofocus
              placeholder="e.g. Savings"
            />
            <span class="absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-ink-soft"
              >{{ label.length }}/{{ ACCOUNT_LABEL_MAX }}</span
            >
          </span>
        </label>
        <div class="grid grid-cols-2 gap-3 pt-1">
          <button type="button" class="btn btn-outline" @click="modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="!label.trim() || busy">
            <UIcon v-if="busy" name="i-lucide-loader-circle" class="size-4 animate-spin" />
            {{ isAdd ? "Create account" : "Save" }}
          </button>
        </div>
      </form>
    </template>
  </UModal>
</template>
