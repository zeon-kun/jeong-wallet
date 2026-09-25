import { entryPoint06Address } from "viem/account-abstraction";
import { sepolia } from "viem/chains";

/** The local Anvil node forks Sepolia, so it keeps Sepolia's chain object and id. */
export const CHAIN = sepolia;
export const CHAIN_ID = sepolia.id; // 11155111

/** Coinbase Smart Account runs on EntryPoint v0.6. */
export const ENTRY_POINT = entryPoint06Address;

/** Coinbase Smart Wallet factory version used for every account. */
export const COINBASE_ACCOUNT_VERSION = "1.1" as const;

/**
 * Address that sends dev-only mint transactions. Nobody holds its key: the app funds it with
 * anvil_setBalance and sends as it via anvil_impersonateAccount.
 */
export const DEV_MINTER = "0x0000000000000000000000000000000000C0FFEE" as const;

/** How much "Fund me" gives an account. */
export const FUND_AMOUNT_ETH = "100";

/** Written by scripts/deploy-token.sh after deploying contracts/MockUSDC.sol. */
export const TOKEN_CONFIG_PATH = "/local-token.json";

export const ACCOUNT_LABEL_MAX = 24;
