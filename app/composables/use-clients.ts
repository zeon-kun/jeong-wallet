import { createPublicClient, createTestClient, createWalletClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";

let clients: ReturnType<typeof createClients> | undefined;

/** "/rpc" -> "http://localhost:3000/rpc". Both services sit behind Nuxt's dev proxy. */
function absolute(url: string) {
  return new URL(url, window.location.origin).toString();
}

function createClients(rpcUrl: string, bundlerUrl: string) {
  const transport = http(rpcUrl);

  // Reads: balances, blocks, contract calls  -> anvil
  const publicClient = createPublicClient({ chain: CHAIN, transport, pollingInterval: 1_000 });

  // Anvil cheats: setBalance ("Fund me"), impersonation, mining  -> anvil
  const testClient = createTestClient({ chain: CHAIN, mode: "anvil", transport });

  // Sends plain transactions from impersonated anvil accounts (dev minting only)  -> anvil
  const devWalletClient = createWalletClient({ chain: CHAIN, transport });

  // UserOperations  -> alto -> EntryPoint on anvil
  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http(bundlerUrl),
    pollingInterval: 1_000,
    userOperation: {
      // Alto's gas price endpoint can disagree with anvil; ask the node directly.
      estimateFeesPerGas: async () => publicClient.estimateFeesPerGas(),
    },
  });

  return { publicClient, testClient, devWalletClient, bundlerClient, rpcUrl, bundlerUrl };
}

export function useClients() {
  if (!clients) {
    const { public: cfg } = useRuntimeConfig();
    clients = createClients(absolute(cfg.rpcUrl), absolute(cfg.bundlerUrl));
  }
  return clients;
}
