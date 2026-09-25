import type { Address, Hex } from "viem";

export type ActivityKind =
  "send-eth" | "send-token" | "batch" | "deploy" | "sign" | "fund" | "mint";
export type ActivityStatus = "pending" | "success" | "failed";

export interface ActivityCall {
  to: Address;
  /** wei as string */
  value?: string;
  token?: { address: Address; symbol: string; decimals: number; amount: string };
  label?: string;
}

export interface ActivityItem {
  id: string;
  userOpHash?: Hex;
  txHash?: Hex;
  /** The account that did it (sender). */
  account: Address;
  kind: ActivityKind;
  to?: Address;
  /** wei as string */
  value?: string;
  token?: { address: Address; symbol: string; decimals: number; amount: string };
  calls?: ActivityCall[];
  status: ActivityStatus;
  /** wei as string, actual gas cost from the receipt */
  fee?: string;
  blockNumber?: string;
  error?: string;
  note?: string;
  createdAt: number;
}

export type ActivityDirection = "out" | "in" | "self";

/** Local history: only what this wallet did. Incoming ETH from outside is not indexed. */
export function useActivity() {
  const items = useState<ActivityItem[]>("activity:items", () => []);

  async function load() {
    items.value = (await db.get<ActivityItem[]>("activity")) ?? [];
  }

  async function save() {
    await db.set("activity", items.value);
  }

  async function add(
    item: Omit<ActivityItem, "id" | "createdAt"> & Partial<Pick<ActivityItem, "id" | "createdAt">>,
  ) {
    const full: ActivityItem = {
      id: item.id ?? crypto.randomUUID(),
      createdAt: item.createdAt ?? Date.now(),
      ...item,
    } as ActivityItem;
    items.value = [full, ...items.value];
    await save();
    return full;
  }

  async function update(id: string, patch: Partial<ActivityItem>) {
    items.value = items.value.map((i) => (i.id === id ? { ...i, ...patch } : i));
    await save();
  }

  /** Items where this address sent, or received from one of our own accounts. Newest first. */
  function forAccount(address?: Address) {
    if (!address) return [];
    return items.value
      .filter((i) => involves(i, address))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function involves(item: ActivityItem, address: Address) {
    return (
      sameAddress(item.account, address) ||
      sameAddress(item.to, address) ||
      !!item.calls?.some((c) => sameAddress(c.to, address))
    );
  }

  function direction(item: ActivityItem, viewer: Address): ActivityDirection {
    if (item.kind === "fund" || item.kind === "mint") return "in";
    if (!sameAddress(item.account, viewer)) return "in";
    if (sameAddress(item.to, viewer)) return "self";
    return "out";
  }

  /**
   * Pending items whose page was closed mid-send: ask the bundler for their receipt.
   * Called by the chain poller; cheap because it only looks at pending UserOps.
   */
  async function reconcile() {
    const pending = items.value.filter((i) => i.status === "pending" && i.userOpHash);
    if (!pending.length) return;
    const { bundlerClient } = useClients();
    for (const item of pending) {
      try {
        const r = await bundlerClient.getUserOperationReceipt({ hash: item.userOpHash! });
        await update(item.id, {
          status: r.success ? "success" : "failed",
          txHash: r.receipt.transactionHash,
          fee: r.actualGasCost.toString(),
          blockNumber: r.receipt.blockNumber.toString(),
        });
      } catch {
        // not mined yet; give up after 10 minutes
        if (Date.now() - item.createdAt > 10 * 60_000)
          await update(item.id, {
            status: "failed",
            error: "The bundler never included this UserOp.",
          });
      }
    }
  }

  function clearState() {
    items.value = [];
  }

  return { items, load, add, update, forAccount, direction, reconcile, clearState };
}
