<script setup lang="ts">
definePageMeta({ title: "Settings", subtitle: "the back pages of your notebook" });

const passkey = usePasskey();
const smart = useSmartAccounts();
const activity = useActivity();
const apps = useConnectedApps();
const modal = useAccountModal();
const status = useChainStatus();
const toast = useToast();
const { copy } = useCopy();
const { rpcUrl, bundlerUrl } = useClients();

const account = computed(() => smart.active.value!);
const fileInput = ref<HTMLInputElement>();
const resetOpen = ref(false);
const resetConfirmed = ref(false);
const exported = ref(false);

onMounted(() => apps.load());

function exportBackup() {
  passkey.exportJson(smart.accounts.value);
  exported.value = true;
  toast.add({
    title: "Backup downloaded",
    description: "Public data only: credential id, public key, account list.",
    color: "success",
    icon: "i-lucide-download",
  });
}

async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const list = await passkey.importJson(file);
    await smart.restoreAccounts(list);
    toast.add({
      title: "Backup restored",
      description: `${smart.accounts.value.length} account(s)`,
      color: "success",
    });
  } catch (err) {
    toast.add({ title: "Import failed", description: humanizeError(err), color: "error" });
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function reset() {
  await db.clear();
  smart.resetState();
  passkey.clearState();
  activity.clearState();
  apps.apps.value = [];
  resetOpen.value = false;
  toast.add({
    title: "Wallet reset",
    description: "Everything was removed from this browser.",
    color: "neutral",
  });
  await navigateTo("/");
}
watch(resetOpen, (v) => v && (resetConfirmed.value = false));
</script>

<template>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
    <div class="flex flex-col gap-7">
      <h1 class="hand relative inline-block self-start text-[32px] lg:hidden">
        Settings<Doodle
          kind="underline"
          class="absolute -bottom-1.5 left-0 h-2.5 w-full text-heart"
        />
      </h1>

      <section>
        <h2 class="scribble mb-2 text-2xl text-pen">Account</h2>
        <div class="sketch-card flex items-center gap-3 px-4 py-3.5">
          <AccountAvatar :index="account.index" :size="42" />
          <div class="min-w-0 flex-1">
            <p class="hand text-[17px]">{{ account.label }}</p>
            <AddressChip :address="account.address" bare class="text-ink-soft" />
          </div>
          <button type="button" class="pill" @click="modal.openRename(account.index)">
            <UIcon name="i-lucide-pencil" class="size-3.5" />Rename
          </button>
        </div>
      </section>

      <section>
        <div class="mb-2 flex items-end justify-between">
          <h2 class="scribble text-2xl text-pen">Backup</h2>
          <span class="scribble flex items-center gap-1 text-lg text-heart"
            >do this first! <Doodle kind="arrow-down" class="size-5 -rotate-12"
          /></span>
        </div>
        <div class="sketch-card ruled">
          <button
            type="button"
            class="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-paper-deep/60"
            @click="exportBackup"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch"
              ><UIcon name="i-lucide-download" class="size-5"
            /></span>
            <span class="flex-1">
              <span class="hand block text-[16px]">Export credential</span>
              <span class="block text-[13px] text-ink-soft"
                >Save your passkey credential ID and account list to a file.</span
              >
            </span>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-ink-soft" />
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-paper-deep/60"
            @click="fileInput?.click()"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch"
              ><UIcon name="i-lucide-upload" class="size-5"
            /></span>
            <span class="flex-1">
              <span class="hand block text-[16px]">Import credential</span>
              <span class="block text-[13px] text-ink-soft"
                >Restore accounts from a backup on this device.</span
              >
            </span>
            <UIcon name="i-lucide-chevron-right" class="size-4 text-ink-soft" />
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImport"
        />
      </section>

      <section>
        <h2 class="scribble mb-2 text-2xl text-pen">Passkey</h2>
        <div class="sketch-card flex items-center gap-3.5 px-4 py-3.5">
          <span
            class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch"
            ><UIcon name="i-lucide-key-round" class="size-5"
          /></span>
          <div class="min-w-0 flex-1">
            <p class="hand text-[16px]">Passkey credential</p>
            <p class="text-[13px] break-words text-ink-soft">
              {{ passkey.credential.value?.rpId }} · this device · id
              <button
                type="button"
                class="font-mono hover:text-pen"
                @click="copy(passkey.credential.value!.id, 'Credential id copied')"
              >
                {{ shortHash(passkey.credential.value?.id) }}
              </button>
            </p>
          </div>
          <span class="hand flex items-center gap-1.5 text-[14px] text-accent"
            ><span class="size-2 rounded-full bg-current" />Saved</span
          >
        </div>
      </section>
    </div>

    <div class="flex flex-col gap-7">
      <section>
        <h2 class="scribble mb-2 text-2xl text-pen">Network</h2>
        <div class="sketch-card ruled">
          <div class="flex items-center gap-3.5 px-4 py-3.5">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch"
              ><UIcon name="i-lucide-server" class="size-5"
            /></span>
            <div class="min-w-0 flex-1">
              <p class="hand text-[16px]">RPC endpoint</p>
              <p class="font-mono text-[12px] break-all text-ink-soft">
                {{ rpcUrl }} · chain {{ status.chainId.value ?? CHAIN_ID }}
              </p>
            </div>
            <span
              class="hand flex shrink-0 items-center gap-1.5 text-[14px]"
              :class="status.anvilOk.value ? 'text-accent' : 'text-danger'"
            >
              <span class="size-2 rounded-full bg-current" />{{
                status.anvilOk.value ? "Connected" : "Down"
              }}
            </span>
          </div>
          <div class="flex items-center gap-3.5 px-4 py-3.5">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch"
              ><UIcon name="i-lucide-package" class="size-5"
            /></span>
            <div class="min-w-0 flex-1">
              <p class="hand text-[16px]">Bundler</p>
              <p class="font-mono text-[12px] break-all text-ink-soft">{{ bundlerUrl }}</p>
            </div>
            <span
              class="hand flex shrink-0 items-center gap-1.5 text-[14px]"
              :class="status.bundlerOk.value ? 'text-accent' : 'text-danger'"
            >
              <span class="size-2 rounded-full bg-current" />{{
                status.bundlerOk.value ? "Connected" : "Down"
              }}
            </span>
          </div>
          <NuxtLink
            to="/dev"
            class="hand flex items-center justify-between px-4 py-3 text-[15px] text-ink-soft hover:text-ink"
          >
            Dev tools: chain status, fund any address
            <UIcon name="i-lucide-chevron-right" class="size-4" />
          </NuxtLink>
        </div>
      </section>

      <section>
        <h2 class="scribble mb-2 text-2xl text-pen">Connected apps</h2>
        <div class="sketch-card ruled">
          <div
            v-for="app in apps.apps.value"
            :key="app.origin"
            class="flex items-center gap-3.5 px-4 py-3.5"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-sketch"
              ><UIcon name="i-lucide-app-window" class="size-5"
            /></span>
            <div class="min-w-0 flex-1">
              <p class="font-mono text-[13px] break-all">{{ app.origin }}</p>
              <p class="text-[12px] text-ink-soft">
                sees
                {{
                  smart.accounts.value.find((a) => a.index === app.accountIndex)?.label ??
                  shortAddress(app.address)
                }}
                · since {{ relativeTime(app.connectedAt) }}
              </p>
            </div>
            <button type="button" class="pill text-danger!" @click="apps.revoke(app.origin)">
              Revoke
            </button>
          </div>
          <p v-if="!apps.apps.value.length" class="px-4 py-4 text-[13px] text-ink-soft">
            No apps connected. Allowed origins:
            <span class="font-mono">{{ apps.allowedOrigins().join(", ") }}</span>
          </p>
        </div>
      </section>

      <section>
        <h2 class="scribble mb-2 text-2xl text-heart">Danger zone</h2>
        <button
          type="button"
          class="sketch-card-danger flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
          @click="resetOpen = true"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-[10px_12px_9px_11px] border-[1.5px] border-danger text-danger"
            ><UIcon name="i-lucide-rotate-ccw" class="size-5"
          /></span>
          <span class="flex-1">
            <span class="hand block text-[16px] text-danger">Reset wallet</span>
            <span class="block text-[13px] text-ink-soft"
              >Remove all accounts and credentials from this browser.</span
            >
          </span>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-ink-soft" />
        </button>
      </section>

      <div class="sticky-note sticky-note-pink tape hidden max-w-[340px] rotate-[-1.5deg] lg:block">
        <p class="hand">Before you reset…</p>
        <p class="text-[13px]">
          Export your credential first. Without a backup you won't be able to access these accounts
          again.
        </p>
      </div>
    </div>

    <UModal v-model:open="resetOpen">
      <template #content>
        <div class="flex flex-col gap-4 p-6">
          <span
            class="grid size-12 place-items-center rounded-[12px_14px_11px_13px] border-[1.6px] border-danger bg-danger-soft text-danger"
          >
            <UIcon name="i-lucide-triangle-alert" class="size-6" />
          </span>
          <h2 class="hand text-[22px]">Reset Jeong Wallet?</h2>
          <p class="text-[14px] text-ink-soft">
            This removes {{ smart.accounts.value.length }} account(s) and your passkey credential
            from this browser. Without an exported backup you won't be able to access these accounts
            again.
          </p>
          <label
            class="flex cursor-pointer items-center gap-3 rounded-[10px_12px_9px_11px] border-[1.4px] border-sketch bg-sticky px-3 py-3 text-on-sticky"
          >
            <input v-model="resetConfirmed" type="checkbox" class="size-5 accent-[#1f2233]" />
            <span class="text-[14px]">I've exported my credential</span>
          </label>
          <button
            v-if="!exported"
            type="button"
            class="hand self-start text-[15px] text-pen underline"
            @click="exportBackup"
          >
            Export it now
          </button>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <button type="button" class="btn btn-outline" @click="resetOpen = false">Cancel</button>
            <button type="button" class="btn btn-danger" :disabled="!resetConfirmed" @click="reset">
              Reset wallet
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
