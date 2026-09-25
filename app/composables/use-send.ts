import type { Address, Hex } from "viem";

export interface Call {
  to: Address;
  value?: bigint;
  data?: Hex;
}

export interface FeeEstimate {
  /** Upper bound: (all gas limits) × maxFeePerGas. The real cost is usually lower. */
  fee: bigint;
  /** The UserOp carries initCode: this send also deploys the account. */
  deploys: boolean;
}

export type SendPhase = "idle" | "signing" | "bundling" | "done" | "error";

/**
 * Sends calls from the active smart account as one UserOperation:
 *   build UserOp -> passkey signs its hash -> Alto simulates + submits handleOps -> receipt.
 */
export function useSend() {
  const { bundlerClient } = useClients();
  const smart = useSmartAccounts();
  const activity = useActivity();
  const token = useToken();

  const phase = ref<SendPhase>("idle");
  const error = ref<string>();

  async function estimate(
    calls: Call[],
    index = smart.active.value?.index ?? 0,
  ): Promise<FeeEstimate> {
    const account = await smart.getAccount(index);
    // Uses the account's stub signature: no passkey prompt for estimates.
    const op = await bundlerClient.prepareUserOperation({ account, calls });
    const gas = op.callGasLimit + op.verificationGasLimit + op.preVerificationGas;
    const initCode = (op as { initCode?: Hex }).initCode;
    return { fee: gas * op.maxFeePerGas, deploys: !!initCode && initCode !== "0x" };
  }

  /**
   * @param calls the calls to execute (one = execute, many = executeBatch)
   * @param record how the send is shown in activity
   * @param options.index send from this account instead of the active one (connect popup)
   */
  async function send(
    calls: Call[],
    record: Omit<ActivityItem, "id" | "createdAt" | "account" | "status">,
    options: { index?: number } = {},
  ) {
    const sender =
      options.index === undefined
        ? smart.active.value
        : smart.accounts.value.find((a) => a.index === options.index);
    if (!sender) throw new Error("No active account.");
    error.value = undefined;
    phase.value = "signing";

    let itemId: string | undefined;
    try {
      const account = await smart.getAccount(sender.index);
      const wasDeployed = await account.isDeployed();

      // The passkey prompt appears inside this call (the UserOp hash is the WebAuthn challenge).
      const userOpHash = await bundlerClient.sendUserOperation({ account, calls });
      phase.value = "bundling";
      const item = await activity.add({
        ...record,
        account: sender.address,
        status: "pending",
        userOpHash,
      });
      itemId = item.id;

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
        timeout: 60_000,
      });
      const patch: Partial<ActivityItem> = {
        status: receipt.success ? "success" : "failed",
        txHash: receipt.receipt.transactionHash,
        fee: receipt.actualGasCost.toString(),
        blockNumber: receipt.receipt.blockNumber.toString(),
        error: receipt.success ? undefined : (receipt.reason ?? "Reverted on-chain"),
      };
      await activity.update(item.id, patch);

      if (!wasDeployed && receipt.success) {
        await activity.add({
          kind: "deploy",
          account: sender.address,
          status: "success",
          userOpHash,
          txHash: receipt.receipt.transactionHash,
          blockNumber: patch.blockNumber,
          note: "Created by the first transaction",
          createdAt: Date.now() - 1,
        });
      }

      await Promise.all([
        smart.refresh(),
        token.refresh(smart.accounts.value.map((a) => a.address)),
      ]);
      phase.value = receipt.success ? "done" : "error";
      if (!receipt.success) error.value = "The transaction was included but reverted.";
      return { ...item, ...patch, deployed: !wasDeployed && receipt.success };
    } catch (e) {
      error.value = humanizeError(e);
      phase.value = "error";
      if (itemId) await activity.update(itemId, { status: "failed", error: error.value });
      throw e;
    }
  }

  function reset() {
    phase.value = "idle";
    error.value = undefined;
  }

  return { phase, error, estimate, send, reset };
}
