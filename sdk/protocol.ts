/**
 * Messages between a dApp window and the wallet's /connect popup (window.postMessage).
 *
 *   dApp                         wallet popup (/connect?origin=<dApp origin>)
 *    │ window.open ───────────────▶ │
 *    │ ◀──────────── jeong:ready    │  (posted to the claimed origin only; if the opener isn't
 *    │                              │   really that origin, the browser drops it)
 *    │ jeong:request ─────────────▶ │  wallet checks event.origin + event.source === opener
 *    │ ◀──────────── jeong:response │  after the user approves / rejects, then the popup closes
 */
export type JeongMethod =
  "eth_requestAccounts" | "eth_accounts" | "eth_chainId" | "personal_sign" | "eth_sendTransaction";

export interface JeongRequest {
  type: "jeong:request";
  id: string;
  method: JeongMethod;
  params?: unknown[];
}

export interface JeongReady {
  type: "jeong:ready";
}

export interface JeongResponse {
  type: "jeong:response";
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}

export type JeongMessage = JeongRequest | JeongReady | JeongResponse;

/** EIP-1193 error codes */
export const ERRORS = {
  userRejected: { code: 4001, message: "User rejected the request." },
  unauthorized: {
    code: 4100,
    message: "This app isn't connected. Call eth_requestAccounts first.",
  },
  unsupported: { code: 4200, message: "Method not supported." },
  internal: { code: -32603, message: "Internal error." },
} as const;

export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111
