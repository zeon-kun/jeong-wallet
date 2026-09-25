import { ERRORS, SEPOLIA_CHAIN_ID_HEX, type JeongMessage, type JeongMethod } from "./protocol";

export * from "./protocol";

export interface JeongProviderOptions {
  /** Where the wallet runs. Default http://localhost:3000 */
  walletUrl?: string;
}

export class JeongRpcError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}

type Listener = (payload: unknown) => void;

/**
 * Tiny EIP-1193-like provider for dApps. Every request that needs the user opens the wallet's
 * /connect popup, sends one request over postMessage and waits for one response.
 * Must be called from a click handler (popup blockers).
 */
export function createJeongProvider(options: JeongProviderOptions = {}) {
  const walletUrl = options.walletUrl ?? "http://localhost:3000";
  const walletOrigin = new URL(walletUrl).origin;
  const storageKey = `jeong:accounts:${walletOrigin}`;
  const listeners = new Map<string, Set<Listener>>();

  let accounts: string[] = [];
  try {
    accounts = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  } catch {}

  function emit(event: string, payload: unknown) {
    listeners.get(event)?.forEach((l) => l(payload));
  }
  function setAccounts(next: string[]) {
    accounts = next;
    localStorage.setItem(storageKey, JSON.stringify(next));
    emit("accountsChanged", next);
  }

  function viaPopup(method: JeongMethod, params?: unknown[]) {
    const url = `${walletUrl}/connect?origin=${encodeURIComponent(window.location.origin)}`;
    const popup = window.open(url, "jeong-wallet", "popup,width=420,height=680");
    if (!popup)
      return Promise.reject(new JeongRpcError(ERRORS.internal.code, "Popup was blocked."));
    const id = crypto.randomUUID();

    return new Promise<unknown>((resolve, reject) => {
      const onMessage = (event: MessageEvent<JeongMessage>) => {
        // Only the wallet origin, only our popup.
        if (event.origin !== walletOrigin || event.source !== popup) return;
        const msg = event.data;
        if (msg?.type === "jeong:ready") {
          popup.postMessage({ type: "jeong:request", id, method, params }, walletOrigin);
        } else if (msg?.type === "jeong:response" && msg.id === id) {
          cleanup();
          if (msg.error) reject(new JeongRpcError(msg.error.code, msg.error.message));
          else resolve(msg.result);
        }
      };
      const closedTimer = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new JeongRpcError(ERRORS.userRejected.code, "Wallet window was closed."));
        }
      }, 400);
      function cleanup() {
        clearInterval(closedTimer);
        window.removeEventListener("message", onMessage);
      }
      window.addEventListener("message", onMessage);
    });
  }

  async function request({
    method,
    params,
  }: {
    method: JeongMethod;
    params?: unknown[];
  }): Promise<unknown> {
    switch (method) {
      case "eth_chainId":
        return SEPOLIA_CHAIN_ID_HEX;
      case "eth_accounts":
        return accounts;
      case "eth_requestAccounts": {
        const result = (await viaPopup(method, params)) as string[];
        setAccounts(result);
        emit("connect", { chainId: SEPOLIA_CHAIN_ID_HEX });
        return result;
      }
      case "personal_sign":
      case "eth_sendTransaction":
        return viaPopup(method, params);
      default:
        throw new JeongRpcError(ERRORS.unsupported.code, `${method} is not supported.`);
    }
  }

  return {
    isJeong: true as const,
    request,
    get accounts() {
      return accounts;
    },
    disconnect() {
      setAccounts([]);
      emit("disconnect", undefined);
    },
    on(event: "accountsChanged" | "connect" | "disconnect", listener: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    removeListener(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener);
    },
  };
}

export type JeongProvider = ReturnType<typeof createJeongProvider>;
