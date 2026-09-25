#!/usr/bin/env bash
# Deploys contracts/MockUSDC.sol to the local fork and writes public/local-token.json,
# which the wallet reads at runtime. Run after `bun run chain` is up. Local use only.
set -euo pipefail
RPC=http://127.0.0.1:8545

# Throwaway deployer key derived from a fixed string (never used anywhere else), funded via anvil cheat.
DEPLOYER_KEY=$(cast keccak "jeong-wallet local token deployer")
DEPLOYER=$(cast wallet address --private-key "$DEPLOYER_KEY")
cast rpc anvil_setBalance "$DEPLOYER" 0x8ac7230489e80000 --rpc-url "$RPC" >/dev/null # 10 ETH

ADDRESS=$(forge create contracts/MockUSDC.sol:MockUSDC \
  --rpc-url "$RPC" --private-key "$DEPLOYER_KEY" --broadcast --json | grep -o '"deployedTo": *"0x[0-9a-fA-F]*"' | grep -o '0x[0-9a-fA-F]*')

if [ -z "$ADDRESS" ]; then
  echo "deploy failed" >&2
  exit 1
fi

mkdir -p public
cat > public/local-token.json <<JSON
{
  "address": "$ADDRESS",
  "symbol": "mUSDC",
  "name": "Mock USD Coin",
  "decimals": 6,
  "chainId": 11155111
}
JSON
echo "MockUSDC deployed at $ADDRESS -> public/local-token.json"
