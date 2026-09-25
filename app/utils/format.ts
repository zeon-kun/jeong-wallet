import { formatUnits, type Address } from "viem";

/** 0x3F9a…c21E */
export function shortAddress(address?: string | null, head = 6, tail = 4) {
  if (!address) return "";
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** 0x7c1e…a93f for hashes */
export function shortHash(hash?: string | null) {
  return shortAddress(hash, 6, 4);
}

/**
 * Formats a raw amount with at most `maxDecimals` fraction digits (rounded down so a balance
 * is never overstated) and trims trailing zeros, keeping at least `minDecimals`.
 */
export function formatAmount(value: bigint, decimals = 18, maxDecimals = 6, minDecimals = 0) {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const [whole = "0", frac = ""] = formatUnits(abs, decimals).split(".");
  let fraction = frac.slice(0, maxDecimals).replace(/0+$/, "");
  if (fraction.length < minDecimals) fraction = fraction.padEnd(minDecimals, "0");
  if (abs > 0n && whole === "0" && !fraction)
    return `${negative ? "-" : ""}<0.${"0".repeat(Math.max(maxDecimals - 1, 0))}1`;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`;
}

/** Full precision string, for tooltips. */
export function formatFull(value: bigint, decimals = 18) {
  return formatUnits(value, decimals);
}

export function sameAddress(a?: string | null, b?: string | null) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function relativeTime(ts: number, now = Date.now()) {
  const s = Math.round((now - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function clockTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "Today", "Yesterday" or "Sep 24" */
export function dayLabel(ts: number, now = Date.now()) {
  const day = (t: number) => new Date(t).toDateString();
  if (day(ts) === day(now)) return "Today";
  if (day(ts) === day(now - 86_400_000)) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Stable avatar pick for an account index (four notebook avatars in /public/avatars). */
export function avatarFor(index: number) {
  return `/avatars/${((index % 4) + 4) % 4}.webp`;
}

export function isHexAddress(value: string): value is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}
