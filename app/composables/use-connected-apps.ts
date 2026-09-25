import type { Address } from "viem";

export interface ConnectedApp {
  origin: string;
  /** Account index the app was given */
  accountIndex: number;
  address: Address;
  connectedAt: number;
}

/** Per-origin "connected" permission for dApps using the popup (M6). */
export function useConnectedApps() {
  const apps = useState<ConnectedApp[]>("connected-apps", () => []);
  const loaded = useState("connected-apps:loaded", () => false);

  async function load() {
    if (!loaded.value) {
      apps.value = (await db.get<ConnectedApp[]>("connectedApps")) ?? [];
      loaded.value = true;
    }
    return apps.value;
  }

  const get = (origin: string) => apps.value.find((a) => a.origin === origin);

  async function connect(app: Omit<ConnectedApp, "connectedAt">) {
    apps.value = [
      ...apps.value.filter((a) => a.origin !== app.origin),
      { ...app, connectedAt: Date.now() },
    ];
    await db.set("connectedApps", apps.value);
  }

  async function revoke(origin: string) {
    apps.value = apps.value.filter((a) => a.origin !== origin);
    await db.set("connectedApps", apps.value);
  }

  /** Origins from runtime config (comma separated). Anything else is ignored by /connect. */
  function allowedOrigins() {
    const raw = String(useRuntimeConfig().public.allowedOrigins ?? "");
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return { apps, load, get, connect, revoke, allowedOrigins };
}
