import {
  toCoinbaseSmartAccount,
  toWebAuthnAccount,
  type SmartAccount,
} from "viem/account-abstraction";
import type { Address } from "viem";

export interface StoredAccount {
  /** Salt ("nonce") passed to the Coinbase factory. Same passkey + different index = different account. */
  index: number;
  label: string;
  /** Cached counterfactual address */
  address: Address;
}

// Built accounts per index. Module scope: a SmartAccount holds functions, so it stays out of state.
let accountCache = new Map<number, Promise<SmartAccount>>();
let readyPromise: Promise<void> | undefined;

export function useSmartAccounts() {
  const { publicClient } = useClients();
  const passkey = usePasskey();

  const accounts = useState<StoredAccount[]>("accounts:list", () => []);
  const activeIndex = useState<number>("accounts:active", () => 0);
  const balances = useState<Record<string, bigint>>("accounts:balances", () => ({}));
  const deployed = useState<Record<string, boolean>>("accounts:deployed", () => ({}));

  const active = computed<StoredAccount | undefined>(
    () => accounts.value.find((a) => a.index === activeIndex.value) ?? accounts.value[0],
  );
  const activeBalance = computed(() =>
    active.value ? balances.value[active.value.address] : undefined,
  );
  const activeDeployed = computed(() =>
    active.value ? deployed.value[active.value.address] : undefined,
  );

  /** Builds the viem SmartAccount for an index: passkey (WebAuthn P-256) as the only owner. */
  function getAccount(index: number) {
    const credential = passkey.credential.value;
    if (!credential) throw new Error("No passkey credential. Create or import one first.");
    let account = accountCache.get(index);
    if (!account) {
      const owner = toWebAuthnAccount({
        credential: { id: credential.id, publicKey: credential.publicKey },
      });
      account = toCoinbaseSmartAccount({
        client: publicClient,
        owners: [owner],
        nonce: BigInt(index),
        version: COINBASE_ACCOUNT_VERSION,
      });
      accountCache.set(index, account);
    }
    return account;
  }

  async function persist() {
    await db.set("accounts", accounts.value);
    await db.set("activeIndex", activeIndex.value);
  }

  /** Loads everything from IndexedDB once per page load. Safe to call from anywhere. */
  function ensureReady() {
    readyPromise ??= (async () => {
      const credential = await passkey.load();
      accounts.value = (await db.get<StoredAccount[]>("accounts")) ?? [];
      activeIndex.value = (await db.get<number>("activeIndex")) ?? 0;
      if (credential && accounts.value.length === 0) await createAccount("Main account", 0);
      await useActivity().load();
    })().catch((e) => {
      readyPromise = undefined;
      throw e;
    });
    return readyPromise;
  }

  async function createAccount(label: string, index?: number) {
    const next = index ?? Math.max(-1, ...accounts.value.map((a) => a.index)) + 1;
    const account = await getAccount(next);
    const stored: StoredAccount = {
      index: next,
      label: label.trim() || `Account ${next + 1}`,
      address: account.address,
    };
    accounts.value = [...accounts.value.filter((a) => a.index !== next), stored].sort(
      (a, b) => a.index - b.index,
    );
    await persist();
    refresh(stored.address);
    return stored;
  }

  /** Restores accounts from a backup, recomputing addresses from the passkey (never trusting the file). */
  async function restoreAccounts(list: Pick<StoredAccount, "index" | "label">[]) {
    accountCache = new Map();
    accounts.value = [];
    for (const item of list.length ? list : [{ index: 0, label: "Main account" }]) {
      await createAccount(item.label, item.index);
    }
    activeIndex.value = accounts.value[0]?.index ?? 0;
    await persist();
  }

  async function rename(index: number, label: string) {
    const clean = label.trim().slice(0, ACCOUNT_LABEL_MAX);
    if (!clean) return;
    accounts.value = accounts.value.map((a) => (a.index === index ? { ...a, label: clean } : a));
    await persist();
  }

  async function setActive(index: number) {
    activeIndex.value = index;
    await persist();
  }

  /** Re-reads balance and code for one address, or all accounts. */
  async function refresh(address?: Address) {
    const targets = address ? [address] : accounts.value.map((a) => a.address);
    await Promise.all(
      targets.map(async (addr) => {
        try {
          const [balance, code] = await Promise.all([
            publicClient.getBalance({ address: addr }),
            publicClient.getCode({ address: addr }),
          ]);
          balances.value = { ...balances.value, [addr]: balance };
          deployed.value = { ...deployed.value, [addr]: !!code && code !== "0x" };
        } catch {
          // chain down: keep the last known values, the status badge shows the problem
        }
      }),
    );
  }

  function findByAddress(address?: string | null) {
    return accounts.value.find((a) => sameAddress(a.address, address));
  }

  function resetState() {
    accountCache = new Map();
    readyPromise = undefined;
    accounts.value = [];
    activeIndex.value = 0;
    balances.value = {};
    deployed.value = {};
  }

  return {
    accounts,
    activeIndex,
    active,
    activeBalance,
    activeDeployed,
    balances,
    deployed,
    getAccount,
    ensureReady,
    createAccount,
    restoreAccounts,
    rename,
    setActive,
    refresh,
    findByAddress,
    resetState,
  };
}
