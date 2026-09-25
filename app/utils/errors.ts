import { BaseError } from "viem";

/** Turns WebAuthn, bundler and RPC errors into one readable sentence. */
export function humanizeError(error: unknown): string {
  const raw = collectMessages(error);
  const has = (...needles: string[]) => needles.some((n) => raw.includes(n.toLowerCase()));

  if (
    has("notallowederror", "not allowed", "operation either timed out", "the operation was aborted")
  )
    return "Passkey prompt was cancelled. Nothing was signed or sent.";
  if (has("webauthn is not supported", "publickeycredential is not defined"))
    return "This browser doesn't support passkeys.";
  if (has("aa21", "didn't pay prefund", "insufficient funds", "sender balance"))
    return "Not enough ETH to cover this and the network fee. Try “Fund me” first.";
  if (
    has("/bundler", "4337", "eth_senduseroperation", "eth_estimateuseroperationgas") &&
    has("fetch", "http request failed", "econnrefused")
  )
    return "The bundler isn't reachable. Is `bun run chain` running?";
  if (has("http request failed", "failed to fetch", "econnrefused", "networkerror"))
    return "Can't reach the local chain. Is `bun run chain` running?";
  if (has("transfer amount exceeds balance", "erc20insufficientbalance"))
    return "Not enough tokens for this transfer.";
  if (has("aa23", "aa24", "signature error"))
    return "The account rejected the signature. Was this passkey created for this account?";
  if (
    has("execution reverted", "useroperation reverted", "reverted during simulation", "aa3", "aa4")
  )
    return "The transaction would fail on-chain (simulation reverted).";

  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function isUserCancel(error: unknown) {
  return (
    collectMessages(error).includes("notallowederror") ||
    humanizeError(error).startsWith("Passkey prompt was cancelled")
  );
}

function collectMessages(error: unknown): string {
  const parts: string[] = [];
  let e: any = error;
  for (let i = 0; e && i < 8; i++) {
    parts.push(
      String(e.name ?? ""),
      String(e.shortMessage ?? ""),
      String(e.details ?? ""),
      String(e.message ?? ""),
    );
    e = e.cause;
  }
  return parts.join(" | ").toLowerCase();
}
