<script setup lang="ts">
import {
  createPublicClient,
  formatEther,
  http,
  parseEther,
  stringToHex,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { sepolia } from "viem/chains";
import { createJeongProvider, type JeongProvider } from "#sdk";

// Reads go straight to anvil (it allows CORS); anything that needs the user goes through the wallet popup.
const client = createPublicClient({ chain: sepolia, transport: http("http://127.0.0.1:8545") });
const wallet = shallowRef<JeongProvider>();
const address = ref<Address>();
const balance = ref<bigint>();
const log = ref<{ at: string; text: string; ok: boolean }[]>([]);
const message = ref("Hello from the playground ♡");
const to = ref("0x000000000000000000000000000000000000dEaD");
const busy = ref("");

onMounted(() => {
  wallet.value = createJeongProvider({ walletUrl: "http://localhost:3000" });
  address.value = wallet.value.accounts[0] as Address | undefined;
  wallet.value.on(
    "accountsChanged",
    (a) => (address.value = (a as string[])[0] as Address | undefined),
  );
  refresh();
  setInterval(refresh, 3000);
});

async function refresh() {
  if (address.value)
    balance.value = await client.getBalance({ address: address.value }).catch(() => undefined);
}
function note(text: string, ok = true) {
  log.value.unshift({ at: new Date().toLocaleTimeString(), text, ok });
}
async function run(name: string, fn: () => Promise<void>) {
  busy.value = name;
  try {
    await fn();
  } catch (e) {
    const err = e as { code?: number; message?: string };
    note(`${name} failed${err.code ? ` (${err.code})` : ""}: ${err.message}`, false);
  } finally {
    busy.value = "";
  }
}

const connect = () =>
  run("connect", async () => {
    const accounts = (await wallet.value!.request({ method: "eth_requestAccounts" })) as Address[];
    address.value = accounts[0];
    note(`connected ${accounts[0]}`);
    refresh();
  });

const sign = () =>
  run("sign", async () => {
    const signature = (await wallet.value!.request({
      method: "personal_sign",
      params: [stringToHex(message.value), address.value],
    })) as Hex;
    // ERC-1271 / ERC-6492 aware verification against the local chain
    const valid = await client.verifyMessage({
      address: address.value!,
      message: message.value,
      signature,
    });
    note(`signature ${signature.slice(0, 18)}… ${valid ? "✓ valid" : "✗ INVALID"}`, valid);
  });

const send = () =>
  run("send", async () => {
    const hash = (await wallet.value!.request({
      method: "eth_sendTransaction",
      params: [{ from: address.value, to: to.value, value: toHex(parseEther("0.1")) }],
    })) as Hex;
    note(`sent 0.1 ETH · tx ${hash}`);
    refresh();
  });

function disconnect() {
  wallet.value?.disconnect();
  address.value = undefined;
  note("disconnected (local only; revoke in wallet Settings)");
}
</script>

<template>
  <main>
    <header>
      <h1>Jeong Playground</h1>
      <p class="sub">A pretend dApp on <code>localhost:3001</code> that uses the wallet popup.</p>
    </header>

    <section class="card">
      <h2>1 · Connect</h2>
      <p v-if="address">
        Connected: <code>{{ address }}</code
        ><br />
        Balance: <b>{{ balance !== undefined ? formatEther(balance) : "…" }} ETH</b>
      </p>
      <p v-else class="muted">Not connected.</p>
      <div class="row">
        <button :disabled="!!busy" @click="connect">
          {{
            busy === "connect" ? "Waiting for wallet…" : address ? "Reconnect" : "Connect wallet"
          }}
        </button>
        <button v-if="address" class="ghost" @click="disconnect">Disconnect</button>
      </div>
    </section>

    <section class="card">
      <h2>2 · Sign a message</h2>
      <input v-model="message" />
      <button :disabled="!address || !!busy" @click="sign">
        {{ busy === "sign" ? "Waiting…" : "Sign message" }}
      </button>
    </section>

    <section class="card">
      <h2>3 · Send 0.1 ETH</h2>
      <input v-model="to" spellcheck="false" />
      <button :disabled="!address || !!busy" @click="send">
        {{ busy === "send" ? "Waiting…" : "Send 0.1 ETH" }}
      </button>
    </section>

    <section class="card">
      <h2>Log</h2>
      <p v-if="!log.length" class="muted">Nothing yet.</p>
      <ul>
        <li v-for="(l, i) in log" :key="i" :class="{ bad: !l.ok }">
          <span class="muted">{{ l.at }}</span> {{ l.text }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style>
:root {
  color-scheme: light dark;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
body {
  margin: 0;
  background: #f4f6fb;
  color: #151823;
}
@media (prefers-color-scheme: dark) {
  body {
    background: #111318;
    color: #e8eaf2;
  }
  .card {
    background: #1a1d25 !important;
    border-color: #2c3140 !important;
  }
}
main {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 16px 64px;
  display: grid;
  gap: 16px;
}
h1 {
  margin: 0;
  font-size: 28px;
}
h2 {
  margin: 0 0 10px;
  font-size: 16px;
}
.sub,
.muted {
  color: #6b7080;
}
.bad {
  color: #c0392b;
}
.card {
  background: #fff;
  border: 1px solid #dde1ea;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 10px;
  min-width: 0;
}
.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
code {
  font-size: 12px;
  word-break: break-all;
}
input {
  font: inherit;
  padding: 8px 10px;
  border: 1px solid #c9ceda;
  border-radius: 8px;
  min-width: 0;
  background: transparent;
  color: inherit;
}
button {
  font: inherit;
  padding: 9px 14px;
  border-radius: 8px;
  border: 0;
  background: #3b5bdb;
  color: #fff;
  cursor: pointer;
  justify-self: start;
}
button.ghost {
  background: transparent;
  color: inherit;
  border: 1px solid #c9ceda;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
  font-size: 13px;
  word-break: break-all;
}
</style>
