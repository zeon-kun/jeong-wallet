#!/usr/bin/env bash
# Starts Anvil (Sepolia fork) + Alto bundler. Ctrl+C stops both.
set -euo pipefail
set -a; source .env; set +a

# Bundler wallets: throwaway keys derived from fixed strings, local use only.
# (Anvil's default test keys are public and used on real Sepolia too. On a fork their
#  balance keeps snapping back to the real Sepolia value, which starves the bundler.)
EXECUTOR_KEY=$(cast keccak "jeong-wallet local bundler executor")
UTILITY_KEY=$(cast keccak "jeong-wallet local bundler utility")
mkdir -p .anvil

# --state saves chain state on exit and reloads it on start
# --block-time 1: mine a block every second. Alto tracks bundles block by block; with
# on-demand mining it can wait forever for the block that frees its executor.
# --disable-code-size-limit: Alto deploys simulation contracts bigger than 24KB on startup.
anvil --fork-url "$SEPOLIA_FORK_RPC" --host 127.0.0.1 --port 8545 --block-time 1 \
  --disable-code-size-limit --state .anvil/state.json --silent &
ANVIL_PID=$!
trap 'kill $ANVIL_PID 2>/dev/null' EXIT

until cast block-number --rpc-url http://127.0.0.1:8545 >/dev/null 2>&1; do sleep 0.5; done
echo "anvil ready"

# The bundler's executor pays gas for handleOps: top both wallets up on every start.
for key in "$EXECUTOR_KEY" "$UTILITY_KEY"; do
  addr=$(cast wallet address --private-key "$key")
  cast rpc anvil_setBalance "$addr" 0x21e19e0c9bab2400000 --rpc-url http://127.0.0.1:8545 >/dev/null # 10,000 ETH
done
echo "bundler wallets funded"

# EntryPoint v0.6 (Coinbase Smart Account) and v0.7
bunx alto \
  --entrypoints "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789,0x0000000071727De22E5E9d8BAf0edAc6f37da032" \
  --executor-private-keys "$EXECUTOR_KEY" \
  --utility-private-key "$UTILITY_KEY" \
  --rpc-url http://127.0.0.1:8545 \
  --port 4337 \
  --min-balance 0 \
  --safe-mode false \
  --block-time 1000 \
  --public-client-log-level warn \
  --rpc-log-level warn