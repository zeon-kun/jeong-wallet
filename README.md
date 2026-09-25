# Jeong Wallet: Project Plan

A learning project: a passkey-based smart account wallet built from scratch with Nuxt, running entirely on a local chain.

> **For Claude Code:** this file is the source of truth for scope, decisions and milestone order. Work one milestone at a time, in order. Each milestone has tasks, design work and a "Done when" checklist. Do not pull in features from later milestones or from the "Out of scope" list without asking. When a milestone is finished, tick its boxes and add notes under "Decisions log".

> **Build status (2026-09-26):** the whole app (M0–M6) is built in the v3 notebook design (`designs/wallet-v3.pen`).
> The unticked checkboxes below are the **learning** checklist: each one is walked through during onboarding, against the finished code.
> Where the build differs from this plan, see "Build notes" at the end of the Decisions log.

**Quick start**

```bash
bun install
cp .env.example .env              # set SEPOLIA_FORK_RPC
bun run dev:all                   # anvil + alto + wallet (:3000) + playground dApp (:3001)
bun run deploy:token              # once per fresh chain: MockUSDC for the Tokens page
```

---

## 1. Goals and non-goals

**Goals**

- Understand every layer of a wallet by building it: keys, signing, accounts, RPC, bundler, dApp connection.
- Use a modern account model from day one: **passkey (WebAuthn) + ERC-4337 smart account**.
- Keep the UI simple and functional. Nuxt UI components, no custom design system.
- Run 100% locally. No testnet faucets, no VPS, no Docker.

**Non-goals (for now)**

- Holding real funds or mainnet support.
- Browser extension, mobile app, WalletConnect.
- Connecting arbitrary third-party dApps (only my own apps, in M6).
- Token lists, NFT support, price feeds, transaction history indexing.

---

## 2. Key decisions

| Topic | Decision | Why |
|---|---|---|
| Framework | Nuxt (SPA mode, `ssr: false`) + TypeScript | My main stack. Wallet code must never run on a server. |
| UI | Nuxt UI (`@nuxt/ui`), default theme | No complex UI needed yet. |
| Chain library | `viem` only (no wagmi, no Privy, no ethers) | See every layer directly. viem has built-in account abstraction and WebAuthn support. |
| Key model | Passkey (WebAuthn, P-256) owns an ERC-4337 smart account | No seed phrase, no password, no secret stored by the app. |
| Smart account | Coinbase Smart Account via `toCoinbaseSmartAccount` | Native passkey support in viem, factory already deployed on Sepolia (so on the fork). |
| Chain | Local **Anvil** node forking **Sepolia** | Free gas, instant blocks, EntryPoint + factory already exist. |
| Bundler | **Alto** (Pimlico, npm package) running locally | Smart accounts need a bundler to submit UserOperations. |
| Gas | Account pays its own gas with free ETH (`anvil_setBalance`) | No paymaster needed locally. |
| Recovery | Rely on passkey sync (Windows Hello / Google Password Manager) + JSON export of public credential | Good enough for a learning project. |
| dApp connection | Only my own apps, via popup + `postMessage` (M6) | Keeps scope small. |

---

## 3. Architecture

```
bun run dev:all
 ├─ anvil   127.0.0.1:8545   local chain, fork of Sepolia (chainId 11155111)
 ├─ alto    127.0.0.1:4337   ERC-4337 bundler, submits UserOps to anvil
 └─ nuxt    localhost:3000   wallet UI (SPA), talks to both from the browser

Browser
 ├─ WebAuthn (Windows Hello / phone)  holds the private key, never leaves the authenticator
 ├─ IndexedDB                          stores PUBLIC data only: credential id, public key, account labels, local tx history
 └─ viem
     ├─ publicClient   reads (balance, block, contract calls)      -> anvil
     ├─ testClient     anvil cheats (setBalance) for "Fund me"     -> anvil
     └─ bundlerClient  sendUserOperation, receipts                 -> alto -> anvil
```

**Flow of a transaction (smart account)**

1. UI builds `calls` (e.g. `{ to, value }`).
2. viem builds a UserOperation for the Coinbase Smart Account.
3. Passkey signs the UserOp hash (browser shows Windows Hello prompt).
4. Bundler (Alto) simulates, then submits `handleOps` to the EntryPoint on Anvil.
5. First UserOp for a new account also deploys the account (counterfactual address becomes real).
6. UI waits for the UserOp receipt and records it in local history.

**Important facts**

- The smart account address is known **before** deployment (counterfactual). It can receive ETH before it exists on-chain.
- The account must hold ETH before its first UserOp (it pays its own gas). Use "Fund me".
- The passkey **public key is only returned at creation**. If it is lost from storage, the app cannot rebuild the account from the passkey alone. Hence the JSON export in M1.
- Passkeys are bound to the domain (RP ID). Passkeys created on `localhost` will not work on a future real domain.

---

## 4. Current state

- [x] WSL, Node, npm, TypeScript installed.
- [x] Nuxt project created, `viem` installed.
- [x] Test page generated a seed phrase, derived an address and read a balance from Sepolia via Alchemy. (Throwaway. The seed shown in a screenshot is considered public; never reuse it.)
- [ ] Switch from remote Sepolia to the local fork (M0).

---

## 5. Project structure (target)

Nuxt 4 layout (`app/` directory). If the project is Nuxt 3, drop the `app/` prefix.

```
jeong-wallet/
├─ app/
│  ├─ app.vue                     <UApp><NuxtPage /></UApp>
│  ├─ pages/
│  │  ├─ index.vue                onboarding: create or sign in with passkey
│  │  ├─ wallet/index.vue         home: account, balance, actions
│  │  ├─ wallet/send.vue
│  │  ├─ wallet/receive.vue
│  │  ├─ wallet/tokens.vue        (M5)
│  │  ├─ wallet/sign.vue          (M4)
│  │  ├─ wallet/activity.vue
│  │  ├─ settings.vue             export/import credential, reset
│  │  ├─ connect.vue              popup approval page for dApps (M6)
│  │  └─ dev.vue                  chain status, Fund me, debug info
│  ├─ components/                 AccountSwitcher, AddressChip, BalanceCard, TxRow, ...
│  ├─ composables/
│  │  ├─ use-clients.ts           publicClient, testClient, bundlerClient
│  │  ├─ use-passkey.ts           create / load / export credential
│  │  ├─ use-smart-accounts.ts     build accounts from passkey (index-based), active account
│  │  ├─ use-send.ts              send ETH / calls via UserOp
│  │  └─ use-activity.ts          local tx history
│  └─ utils/
│     ├─ db.ts                    IndexedDB wrapper (idb-keyval or tiny custom)
│     ├─ format.ts                shorten address, format ETH
│     └─ constants.ts             entrypoint addresses, token address
├─ contracts/MockUSDC.sol         (M5)
├─ scripts/
│  ├─ local-chain.sh              starts anvil + alto
│  └─ deploy-token.sh             (M5)
├─ playground/                    second Nuxt app acting as a dApp (M6)
├─ sdk/                           tiny wallet connector SDK (M6)
├─ .anvil/                        anvil state (gitignored)
├─ .env
└─ nuxt.config.ts
```

---

## 6. Data model (IndexedDB, public data only)

```ts
// NEVER store private keys or secrets. There are none: the passkey holds the key.

interface StoredCredential {
  id: string            // WebAuthn credential id
  publicKey: `0x${string}` // P-256 public key, returned only at creation
  createdAt: number
  rpId: string          // e.g. "localhost"
}

interface StoredAccount {
  index: number         // smart account nonce/salt used with toCoinbaseSmartAccount
  label: string         // "Main", "Savings", ...
  address: `0x${string}`// cached counterfactual address
}

interface ActivityItem {
  userOpHash: `0x${string}`
  txHash?: `0x${string}`
  account: `0x${string}`
  kind: 'send-eth' | 'send-token' | 'batch' | 'deploy' | 'sign'
  to?: `0x${string}`
  value?: string        // wei as string
  token?: `0x${string}`
  status: 'pending' | 'success' | 'failed'
  createdAt: number
}
```

---

## 7. Milestones

Order is fixed. No schedule: treat as an ordered checklist.

### M0: Local chain inside the repo

**Tasks**

- [x] Install Foundry in WSL: `curl -L https://foundry.paradigm.xyz | bash`, then `foundryup`.
- [x] `npm i -D @pimlico/alto concurrently` and `npx nuxi module add ui`.
- [x] Add `.env`:
  ```bash
  SEPOLIA_FORK_RPC=https://eth-sepolia.g.alchemy.com/v2/<key>
  NUXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
  NUXT_PUBLIC_BUNDLER_URL=http://127.0.0.1:4337
  ```
- [x] Create `scripts/local-chain.sh`:
  ```bash
  #!/usr/bin/env bash
  # Starts Anvil (Sepolia fork) + Alto bundler. Ctrl+C stops both.
  set -euo pipefail
  set -a; source .env; set +a

  # Anvil built-in test accounts #0 and #1 (public keys, local use only)
  EXECUTOR_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  UTILITY_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
  mkdir -p .anvil

  # --state saves chain state on exit and reloads it on start
  anvil --fork-url "$SEPOLIA_FORK_RPC" --host 127.0.0.1 --port 8545 --state .anvil/state.json &
  ANVIL_PID=$!
  trap 'kill $ANVIL_PID 2>/dev/null' EXIT

  until cast block-number --rpc-url http://127.0.0.1:8545 >/dev/null 2>&1; do sleep 0.5; done
  echo "anvil ready"

  # EntryPoint v0.6 (Coinbase Smart Account) and v0.7
  npx alto \
    --entrypoints "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789,0x0000000071727De22E5E9d8BAf0edAc6f37da032" \
    --executor-private-keys "$EXECUTOR_KEY" \
    --utility-private-key "$UTILITY_KEY" \
    --rpc-url http://127.0.0.1:8545 \
    --port 4337 \
    --min-balance 0 \
    --safe-mode false
  ```
  If Alto rejects a flag, run `npx alto help` and adjust (its CLI changes between versions).
- [x] `package.json` scripts:
  ```json
  "chain": "bash scripts/local-chain.sh",
  "dev:all": "concurrently -k -n chain,nuxt \"npm:chain\" \"npm:dev\""
  ```
- [x] Add `.anvil/` to `.gitignore`.
- [x] `nuxt.config.ts`:
  ```ts
  export default defineNuxtConfig({
    ssr: false,
    modules: ['@nuxt/ui'],
    runtimeConfig: { public: { rpcUrl: '', bundlerUrl: '' } },
  })
  ```
- [x] `composables/use-clients.ts` with `publicClient` and `testClient` (`mode: 'anvil'`), both using viem's `sepolia` chain object and the local RPC URL.
- [ ] `pages/dev.vue`: shows chain ID, current block number, RPC and bundler status (ping), and a "Fund address" form (`testClient.setBalance`, 100 ETH).
- [ ] Replace the throwaway seed-phrase test page.

**Design work**

- App shell: `UApp` wrapper, simple header (app name, network badge "Local fork", color mode toggle), centered content column (max ~480px, wallet-like).
- Dev page: `UCard` with status rows (green/red `UBadge` for anvil and bundler), `UInput` + `UButton` for funding.

**Done when**

- [ ] `npm run dev:all` starts anvil, alto and Nuxt with no errors.
- [ ] Dev page shows chainId `11155111` and a block number that increases after actions.
- [ ] Funding an address sets its balance to 100 ETH.

**Troubleshooting**

- CORS errors calling Alto from the browser: route both services through Nuxt's dev proxy (`nitro.devProxy` for `/rpc` and `/bundler`) and point the runtime config at `${location.origin}/rpc` and `/bundler`.

---

### M1: Passkey account (create, sign in, persist)

**Tasks**

- [ ] `usePasskey.ts`:
  - `create(name)`: `createWebAuthnCredential({ name })` from `viem/account-abstraction`, save `{ id, publicKey, rpId, createdAt }` to IndexedDB.
  - `load()`: read stored credential.
  - `exportJson()` / `importJson()`: download and upload the public credential (backup, no secrets).
- [ ] `useSmartAccounts.ts`:
  - `owner = toWebAuthnAccount({ credential })`.
  - `account = await toCoinbaseSmartAccount({ client: publicClient, owners: [owner] })` (check current viem docs for required params such as `version`).
  - Expose `address` (counterfactual) and `isDeployed` (`publicClient.getCode`).
- [ ] Onboarding page (`/`): if no credential, "Create passkey wallet"; if a credential exists, "Continue" (goes to `/wallet`).
- [ ] Route guard: `/wallet/*` redirects to `/` when no credential is stored.
- [ ] Wallet home shows address (copyable), balance, deployed / not deployed badge, "Fund me" shortcut (dev only).
- [ ] Settings: export credential JSON, import credential JSON, reset (clear IndexedDB with confirmation).

**Design work**

- Onboarding screen: title, one-paragraph explanation ("Your key lives in your device's passkey, not in this app"), primary button. States: creating (loading), cancelled by user, WebAuthn unsupported.
- Wallet home: `UCard` with address chip (shortened, copy icon, toast on copy), big balance, `UBadge` for deployed status, action buttons row (Send, Receive, Sign; disabled until their milestone).
- Settings: list of actions, destructive reset in a `UModal` confirm.

**Done when**

- [ ] Creating a passkey shows a Windows Hello (or phone) prompt and lands on the wallet home with an address.
- [ ] Reloading the page keeps the same address.
- [ ] Export, reset, then import restores the same address.
- [ ] No private key or secret appears anywhere in IndexedDB, localStorage or logs.

---

### M2: Send and receive ETH

**Tasks**

- [ ] `useClients.ts`: add `bundlerClient = createBundlerClient({ client: publicClient, transport: http(bundlerUrl) })`.
- [ ] `useSend.ts`: `sendUserOperation({ account, calls: [{ to, value }] })`, then `waitForUserOperationReceipt({ hash })`. Record in activity (pending, then success/failed).
- [ ] First send on an undeployed account deploys it; show that in the UI ("This first transaction also creates your account").
- [ ] Send page: recipient (validate with `isAddress`, checksum), amount (`parseEther`), "Max" button (balance minus estimated fee), review step, confirm (passkey prompt), result.
- [ ] Receive page: address + QR code (e.g. `qrcode` package), copy button.
- [ ] Activity page: list from IndexedDB, newest first, status badges. Note: incoming ETH is not indexed; only record what this wallet sends (and transfers between own accounts from M3).
- [ ] Error handling: user cancels passkey prompt, insufficient balance, bundler down, simulation revert. Human-readable messages via `UToast`.

**Design work**

- Send flow as 3 steps in one page: Form, Review (to, amount, estimated fee, "deploys account" note), Result (success with tx hash, or error with retry).
- Receive: centered QR, address below, copy button.
- Activity row: icon by kind, short counterpart address, amount, relative time, status badge. Empty state: "No activity yet".

**Done when**

- [ ] Funded account sends 1 ETH to another address; recipient balance increases by 1 ETH.
- [ ] Account shows as deployed after its first send.
- [ ] Cancelling the passkey prompt shows a clear message and nothing is sent.
- [ ] Activity shows the send with its final status.

**Troubleshooting**

- Fee estimation errors from the bundler: pass `userOperation: { estimateFeesPerGas: async () => publicClient.estimateFeesPerGas() }` when creating the bundler client.

---

### M3: Multiple accounts

**Tasks**

- [ ] One passkey owns several smart accounts, each built with a different `nonce` (salt/index) in `toCoinbaseSmartAccount`.
- [ ] Store accounts `{ index, label, address }`; "Add account" creates the next index.
- [ ] Active account persisted; all pages use the active account.
- [ ] Rename account label.
- [ ] Send page: quick-pick "My accounts" as recipients.

**Design work**

- `AccountSwitcher` in the header: `UDropdownMenu` listing label, short address, balance; "Add account" at the bottom.
- Rename via small `UModal` with `UInput`.
- Visual distinction per account (e.g. colored avatar generated from the address).

**Done when**

- [ ] Account 1 and Account 2 have different addresses and balances.
- [ ] Sending from Account 1 to Account 2 via the quick-pick works and shows in both activity views.
- [ ] Switching accounts persists across reload.

---

### M4: Sign and verify messages

**Tasks**

- [ ] Sign page: textarea message, "Sign" (passkey prompt), shows signature.
- [ ] `account.signMessage({ message })`. For undeployed accounts the signature is ERC-6492-wrapped; for deployed accounts it is checked via ERC-1271.
- [ ] Verify panel: address + message + signature, `publicClient.verifyMessage(...)`, valid/invalid result.
- [ ] (Optional) EIP-712 typed data signing with a sample payload.

**Design work**

- Two tabs (`UTabs`): Sign, Verify.
- Signature shown in a monospace, copyable block; long hex truncated with expand.
- Verify result: large green check or red cross with a one-line explanation.

**Done when**

- [ ] Signature from a deployed account verifies as valid.
- [ ] Signature from an undeployed account verifies as valid (6492).
- [ ] Changing one character of the message makes verification fail.

---

### M5: ERC-20 tokens

**Tasks**

- [ ] `contracts/MockUSDC.sol`: ERC-20 with 6 decimals and a public `mint(address,uint256)` (local testing only).
- [ ] `scripts/deploy-token.sh`: `forge create` with Anvil account #0, write the address to a config file the app reads.
- [ ] Tokens page: MockUSDC balance, "Mint 1,000" (dev), send token (`encodeFunctionData` for `transfer`).
- [ ] Batch demo: one UserOp with two calls (e.g. send ETH and send USDC, or `approve` + `transfer`) to show smart account batching.
- [ ] Activity records token sends and batches.

**Design work**

- Token list rows: symbol, name, balance (formatted with decimals), actions.
- Send flow reuses M2's 3-step pattern with a token selector (`USelect`).
- Batch builder: list of calls with add/remove, single review screen showing all calls, one confirm.

**Done when**

- [ ] Mint shows 1,000 MockUSDC.
- [ ] Sending 100 MockUSDC to Account 2 updates both balances.
- [ ] A batch of 2 calls is confirmed with one passkey prompt and appears as one activity item.

---

### M6: Connect my own apps (popup wallet)

**Tasks**

- [ ] `sdk/`: tiny connector for dApps. `connect()` opens `http://localhost:3000/connect` via `window.open`, communicates with `postMessage`, exposes an EIP-1193-like `request({ method, params })`.
- [ ] Supported methods: `eth_requestAccounts`, `eth_accounts`, `eth_chainId`, `personal_sign`, `eth_sendTransaction` (mapped to a UserOp; return the tx hash after receipt).
- [ ] `/connect` page in the wallet: shows requesting origin, the request, Approve / Reject.
- [ ] Security: check `event.origin` against an allowlist (start with `http://localhost:3001`), ignore everything else; per-origin "connected" permission stored in IndexedDB; revoke in Settings.
- [ ] `playground/`: second Nuxt app on port 3001 with buttons: Connect, Sign message, Send 0.1 ETH.
- [ ] (Stretch) Use the wallet from the EMR PoC (grant access to a doctor via the registry contract).

**Design work**

- Connect popup (small window ~400x600): app origin prominent, what it asks for in plain words, Approve (primary) / Reject.
- Request types: connect, sign (show message), transaction (to, value, decoded call if known).
- Settings: "Connected apps" list with revoke buttons.

**Done when**

- [ ] Playground connects and shows the active wallet address.
- [ ] Playground requests a signature, the popup shows the message, approve returns a valid signature.
- [ ] Playground sends 0.1 ETH through the popup and shows the tx hash.
- [ ] A page on a non-allowlisted origin gets no response.

---

### Later (not scheduled)

- Backup passkey as a second owner (`addOwnerPublicKey` on the Coinbase account).
- Recover the account on a new device: look up owners on-chain instead of relying on the JSON export.
- Deploy UI to a real domain (new passkeys needed, RP ID changes) and switch to real Sepolia with a paymaster.
- Transaction simulation and decoded previews before signing.
- Browser extension version (WXT).
- EMR integration: "decrypt shared record key" feature.

---

## 8. Design guidelines (all milestones)

- Nuxt UI defaults, one primary color, light and dark mode.
- Responsive. Mobile (<1024px): single column, max width ~480px. Desktop (>=1024px): sidebar nav + wider main area (e.g. balance/actions and activity side by side). The M6 connect popup always uses the mobile layout.
- Every async action has three visible states: loading, success (toast), error (toast with a readable message and a retry where it makes sense).
- Addresses: always shortened `0x1234…abcd` with copy button and full value in a tooltip.
- Amounts: max 6 decimals shown, full value on hover.
- Every signature or transaction goes through a review screen before the passkey prompt.
- Persistent "Local fork" badge in the header so it is never confused with a real network.

**Screen inventory**

| Screen | Milestone |
|---|---|
| Dev / chain status | M0 |
| Onboarding (create / continue) | M1 |
| Wallet home | M1 |
| Settings (export, import, reset) | M1 |
| Send (form, review, result) | M2 |
| Receive (QR) | M2 |
| Activity | M2 |
| Account switcher + rename | M3 |
| Sign / Verify | M4 |
| Tokens + batch builder | M5 |
| Connect popup + connected apps | M6 |
| Playground dApp | M6 |

---

## 9. Security rules (even for a learning project)

- Never store private keys, seed phrases or secrets. The app only stores public data.
- Anvil and Alto listen on `127.0.0.1` only. Never expose them publicly: Anvil has no auth and exposes cheat methods.
- Anvil test keys in scripts are public and for local use only.
- `postMessage`: always check `event.origin`, always send to an explicit target origin, never `*`.
- Never put real funds into this wallet.

---

## 10. Commands

```bash
bun run dev:all        # anvil + alto + wallet (:3000) + playground dApp (:3001)
bun run chain          # only anvil + alto (first start of a saved fork can take 1-2 min)
bun run dev            # only the wallet
bun run playground     # only the playground dApp
bun run deploy:token   # deploy MockUSDC, writes public/local-token.json (M5)
rm -rf .anvil          # reset local chain state (fresh fork), then redeploy the token
```

---

## 11. Decisions log

Add a dated line whenever a decision changes or a milestone finishes.

- 2026-09-25: Plan created. Passkey + Coinbase Smart Account, local Anvil fork + Alto, Nuxt UI, viem only.
- 2026-09-25: Desktop gets its own responsive layout (sidebar + two-pane) instead of the 480px column on every screen size. Mockups live in `designs/` (pen.dev).
- 2026-09-26: Bun instead of npm (`bun add`, `bunx`, `bun run`). Files use kebab-case (`use-clients.ts`); exports stay camelCase.
- 2026-09-26: Whole app built (M0–M6) in the v3 notebook design. Learning checkboxes left unticked for onboarding.

**Build notes (where the build differs from the plan above)**

- Browser talks to anvil and alto through Nuxt's dev proxy (`/rpc`, `/bundler`): Alto sends no CORS headers. `.env` now uses `RPC_URL` / `BUNDLER_URL` (proxy targets) instead of `NUXT_PUBLIC_*`.
- `local-chain.sh`:
  - anvil runs with `--block-time 1`. With on-demand mining, Alto waited forever for the block that frees its executor after the first bundle.
  - anvil runs with `--disable-code-size-limit`. Alto deploys simulation contracts bigger than 24 KB on a fresh fork.
  - Bundler wallets use their own throwaway keys (`cast keccak "jeong-wallet local bundler …"`), topped up on every start. On the fork, Anvil test key #0 kept snapping back to its real Sepolia balance (almost 0), which starved the bundler.
- Coinbase Smart Account factory **v1.1** (`version: "1.1"`), EntryPoint v0.6. Account index = factory `nonce` (salt).
- Dev minting and the token deploy never use a private key in the app: minting impersonates `0x…C0FFEE` (`anvil_impersonateAccount`), deploy-token uses a throwaway key derived from a fixed string.
- Activity also has `fund` and `mint` kinds. Pending items left by a closed tab are reconciled with `eth_getUserOperationReceipt`.
- M6 protocol: `/connect?origin=<dApp origin>`. The popup posts `jeong:ready` only to that origin (browser drops it if the opener isn't really that origin), accepts requests only from `event.origin === origin && event.source === window.opener`, and answers with an explicit target origin. Allowlist: `runtimeConfig.public.allowedOrigins`.
- Type checking: the project resolves TypeScript 7 (native), which `vue-tsc` can't run on yet. Checked with TS 5.9 + vue-tsc outside the repo: 0 errors.

