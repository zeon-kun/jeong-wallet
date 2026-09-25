import { clear, createStore, del, get, set, type UseStore } from "idb-keyval";

/**
 * Tiny IndexedDB wrapper. Only PUBLIC data goes in here: the passkey's credential id and
 * public key, account labels, local activity and connected apps. There is no secret to store:
 * the private key never leaves the authenticator.
 */
export type DbKey = "credential" | "accounts" | "activeIndex" | "activity" | "connectedApps";

let store: UseStore | undefined;
function getStore() {
  store ??= createStore("jeong-wallet", "kv");
  return store;
}

// Vue proxies and bigints are not structured-clone friendly, so values are stored as plain JSON.
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const db = {
  get: <T>(key: DbKey) => get<T>(key, getStore()),
  set: <T>(key: DbKey, value: T) => set(key, plain(value), getStore()),
  del: (key: DbKey) => del(key, getStore()),
  clear: () => clear(getStore()),
};
