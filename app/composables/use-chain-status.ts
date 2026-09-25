/** Anvil + bundler health, polled while any component uses it. */
export function useChainStatus() {
  const { publicClient, bundlerClient } = useClients();
  const blockNumber = useState<bigint | undefined>("chain:block", () => undefined);
  const chainId = useState<number | undefined>("chain:id", () => undefined);
  const anvilOk = useState<boolean | undefined>("chain:anvil", () => undefined);
  const bundlerOk = useState<boolean | undefined>("chain:bundler", () => undefined);
  const entryPoints = useState<string[]>("chain:entrypoints", () => []);

  async function check() {
    try {
      const [id, block] = await Promise.all([
        publicClient.getChainId(),
        publicClient.getBlockNumber({ cacheTime: 0 }),
      ]);
      chainId.value = id;
      blockNumber.value = block;
      anvilOk.value = true;
    } catch {
      anvilOk.value = false;
    }
    try {
      entryPoints.value = [...(await bundlerClient.getSupportedEntryPoints())];
      bundlerOk.value = true;
    } catch {
      bundlerOk.value = false;
    }
  }

  return { blockNumber, chainId, anvilOk, bundlerOk, entryPoints, check };
}

/**
 * Keeps balances fresh: one poller for the whole app (started by the wallet layout).
 * Anvil only mines on demand, so "a new block" is a good signal to re-read balances.
 */
let pollerStarted = false;
export function useChainPoller() {
  const status = useChainStatus();
  const accounts = useSmartAccounts();
  const token = useToken();
  const activity = useActivity();
  if (pollerStarted) return status;
  pollerStarted = true;

  let lastBlock: bigint | undefined;
  const tick = async () => {
    await status.check();
    if (status.blockNumber.value !== lastBlock) {
      lastBlock = status.blockNumber.value;
      const addresses = accounts.accounts.value.map((a) => a.address);
      await Promise.all([
        accounts.refresh(),
        token.load(!token.token.value).then(() => token.refresh(addresses)),
        activity.reconcile(),
      ]);
    }
  };
  tick();
  setInterval(tick, 3_000);
  return status;
}
