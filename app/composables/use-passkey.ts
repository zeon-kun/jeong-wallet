import { createWebAuthnCredential } from "viem/account-abstraction";
import type { Hex } from "viem";

export interface StoredCredential {
  /** WebAuthn credential id */
  id: string;
  /** P-256 public key. Returned ONLY at creation, so it must be stored (and backed up). */
  publicKey: Hex;
  createdAt: number;
  /** Passkeys are bound to this domain, e.g. "localhost". */
  rpId: string;
  name: string;
}

/** Backup file: public data only. */
export interface WalletBackup {
  app: "jeong-wallet";
  version: 1;
  exportedAt: number;
  credential: StoredCredential;
  accounts: StoredAccount[];
}

export function usePasskey() {
  const credential = useState<StoredCredential | null>("passkey:credential", () => null);
  const loaded = useState("passkey:loaded", () => false);

  const isSupported = computed(
    () => typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined",
  );

  async function load() {
    if (!loaded.value) {
      credential.value = (await db.get<StoredCredential>("credential")) ?? null;
      loaded.value = true;
    }
    return credential.value;
  }

  /** Shows the OS passkey prompt (Windows Hello, Touch ID, phone...). */
  async function create(name = "Jeong Wallet") {
    const created = await createWebAuthnCredential({ name });
    const stored: StoredCredential = {
      id: created.id,
      publicKey: created.publicKey,
      createdAt: Date.now(),
      rpId: window.location.hostname,
      name,
    };
    await db.set("credential", stored);
    credential.value = stored;
    loaded.value = true;
    return stored;
  }

  function buildBackup(accounts: StoredAccount[]): WalletBackup {
    if (!credential.value) throw new Error("No passkey credential to export.");
    return {
      app: "jeong-wallet",
      version: 1,
      exportedAt: Date.now(),
      credential: credential.value,
      accounts,
    };
  }

  function exportJson(accounts: StoredAccount[]) {
    const backup = buildBackup(accounts);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jeong-wallet-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return backup;
  }

  /** Validates a backup file and stores its credential. Returns the accounts it contains. */
  async function importJson(file: File | string) {
    const text = typeof file === "string" ? file : await file.text();
    let data: WalletBackup;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("That file isn't valid JSON.");
    }
    const c = data?.credential;
    if (data?.app !== "jeong-wallet" || !c)
      throw new Error("That file isn't a Jeong Wallet backup.");
    if (typeof c.id !== "string" || !/^0x[0-9a-fA-F]{128}$/.test(c.publicKey ?? ""))
      throw new Error("The backup's credential is incomplete.");
    if (c.rpId && c.rpId !== window.location.hostname)
      throw new Error(`This passkey belongs to “${c.rpId}”, not “${window.location.hostname}”.`);

    const stored: StoredCredential = {
      id: c.id,
      publicKey: c.publicKey,
      createdAt: c.createdAt ?? Date.now(),
      rpId: c.rpId ?? window.location.hostname,
      name: c.name ?? "Jeong Wallet",
    };
    await db.set("credential", stored);
    credential.value = stored;
    loaded.value = true;

    const accounts = Array.isArray(data.accounts)
      ? data.accounts.filter((a) => Number.isInteger(a?.index) && typeof a?.label === "string")
      : [];
    return accounts;
  }

  function clearState() {
    credential.value = null;
    loaded.value = true;
  }

  return { credential, loaded, isSupported, load, create, exportJson, importJson, clearState };
}
