import type { Address } from "viem";

/** Presentation for one activity item as seen from `viewer`. */
export function describeActivity(
  item: ActivityItem,
  viewer: Address,
  labelOf: (a?: string) => string | undefined,
) {
  const incoming =
    item.kind === "fund" || item.kind === "mint" || !sameAddress(item.account, viewer);
  const counterpart = incoming ? item.account : item.to;
  const who = (a?: string) => labelOf(a) ?? shortAddress(a);

  let title = "Sent";
  let icon = "i-lucide-arrow-up-right";
  let subtitle = item.to ? `to ${who(item.to)}` : "";
  let amount: { value: string; decimals: number; symbol: string } | undefined;

  if (item.token)
    amount = { value: item.token.amount, decimals: item.token.decimals, symbol: item.token.symbol };
  else if (item.value) amount = { value: item.value, decimals: 18, symbol: "ETH" };

  switch (item.kind) {
    case "fund":
      title = "Received";
      icon = "i-lucide-arrow-down-left";
      subtitle = "from Anvil faucet";
      break;
    case "mint":
      title = "Minted";
      icon = "i-lucide-coins";
      subtitle = `${item.token?.symbol ?? "tokens"} · dev faucet`;
      break;
    case "deploy":
      title = "Account deployed";
      icon = "i-lucide-sparkles";
      subtitle = "Smart account";
      amount = undefined;
      break;
    case "sign":
      title = "Signed message";
      icon = "i-lucide-pen-line";
      subtitle = item.note ?? "";
      amount = undefined;
      break;
    case "batch": {
      title = incoming ? "Received (batch)" : `Batch · ${item.calls?.length ?? 0} calls`;
      icon = "i-lucide-layers";
      subtitle = incoming ? `from ${who(item.account)}` : "one UserOp, one passkey prompt";
      if (incoming) {
        const mine = item.calls?.filter((c) => sameAddress(c.to, viewer)) ?? [];
        const first = mine[0];
        if (first?.token)
          amount = {
            value: first.token.amount,
            decimals: first.token.decimals,
            symbol: first.token.symbol,
          };
        else if (first?.value) amount = { value: first.value, decimals: 18, symbol: "ETH" };
      } else amount = undefined;
      break;
    }
    default:
      if (incoming) {
        title = "Received";
        icon = "i-lucide-arrow-down-left";
        subtitle = `from ${who(counterpart)}`;
      }
  }

  if (item.status === "failed") icon = "i-lucide-x";
  const tone = item.status === "failed" ? "failed" : incoming ? "in" : "out";
  const sign = amount ? (incoming ? "+" : "−") : "";
  return { title, subtitle, icon, amount, sign, incoming, tone };
}
