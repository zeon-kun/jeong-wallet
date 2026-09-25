import { parseEther, type Address } from "viem";

/** Dev "Fund me": anvil_setBalance to 100 ETH. A cheat method, only exists on the local node. */
export function useFaucet() {
  const { testClient, publicClient } = useClients();
  const smart = useSmartAccounts();
  const activity = useActivity();
  const toast = useToast();
  const busy = ref(false);

  async function fund(address: Address, eth = FUND_AMOUNT_ETH) {
    busy.value = true;
    try {
      const before = await publicClient.getBalance({ address });
      const target = parseEther(eth);
      await testClient.setBalance({ address, value: target });
      // setBalance doesn't mine a block; mine one so watchers see the change.
      await testClient.mine({ blocks: 1 });
      const delta = target - before;
      if (smart.findByAddress(address) && delta > 0n) {
        await activity.add({
          kind: "fund",
          account: address,
          to: address,
          value: delta.toString(),
          status: "success",
        });
      }
      await smart.refresh();
      toast.add({
        title: `Balance set to ${eth} ETH`,
        description: shortAddress(address),
        color: "success",
        icon: "i-lucide-droplet",
      });
    } catch (e) {
      toast.add({ title: "Funding failed", description: humanizeError(e), color: "error" });
    } finally {
      busy.value = false;
    }
  }

  return { fund, busy };
}
