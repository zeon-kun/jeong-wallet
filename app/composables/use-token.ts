import { encodeFunctionData, erc20Abi, parseAbi, parseUnits, type Address } from "viem";

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
}

const mintAbi = parseAbi(["function mint(address to, uint256 amount)"]);

/** MockUSDC from contracts/MockUSDC.sol. Address comes from public/local-token.json (deploy-token.sh). */
export function useToken() {
  const { publicClient, testClient, devWalletClient } = useClients();
  const token = useState<TokenInfo | null>("token:info", () => null);
  const loaded = useState("token:loaded", () => false);
  const balances = useState<Record<string, bigint>>("token:balances", () => ({}));

  async function load(force = false) {
    if (loaded.value && !force) return token.value;
    try {
      const res = await fetch(`${TOKEN_CONFIG_PATH}?t=${Date.now()}`, { cache: "no-store" });
      const info = res.ok ? ((await res.json()) as TokenInfo) : null;
      // The JSON can outlive the chain (rm -rf .anvil): only trust it when there is code at the address.
      const code = info ? await publicClient.getCode({ address: info.address }) : undefined;
      token.value = info && code && code !== "0x" ? info : null;
    } catch {
      token.value = null;
    }
    loaded.value = true;
    return token.value;
  }

  async function refresh(addresses: Address[]) {
    if (!token.value) return;
    const t = token.value;
    await Promise.all(
      addresses.map(async (address) => {
        try {
          const b = await publicClient.readContract({
            address: t.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          });
          balances.value = { ...balances.value, [address]: b };
        } catch {}
      }),
    );
  }

  /** Dev only: mint as an impersonated anvil account. No passkey, no private key in the app. */
  async function devMint(to: Address, amount = "1000") {
    if (!token.value)
      throw new Error("MockUSDC isn't deployed. Run `bash scripts/deploy-token.sh`.");
    await testClient.setBalance({ address: DEV_MINTER, value: 10n ** 18n });
    await testClient.impersonateAccount({ address: DEV_MINTER });
    try {
      const hash = await devWalletClient.writeContract({
        account: DEV_MINTER,
        address: token.value.address,
        abi: mintAbi,
        functionName: "mint",
        args: [to, parseUnits(amount, token.value.decimals)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt;
    } finally {
      await testClient.stopImpersonatingAccount({ address: DEV_MINTER });
    }
  }

  function transferCall(to: Address, amount: bigint) {
    if (!token.value) throw new Error("No token configured.");
    return {
      to: token.value.address,
      value: 0n,
      data: encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to, amount] }),
    };
  }

  return { token, loaded, balances, load, refresh, devMint, transferCall };
}
