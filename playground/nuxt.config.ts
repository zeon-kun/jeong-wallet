// A second app acting as a dApp that talks to Jeong Wallet through the popup SDK (M6).
// Run with `bun run playground` (port 3001, which is on the wallet's origin allowlist).
export default defineNuxtConfig({
  ssr: false,
  devServer: { port: 3001 },
  alias: { "#sdk": "../sdk/index.ts" },
  vite: { server: { fs: { allow: [".."] } } },
  app: { head: { title: "Jeong Playground" } },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
});
