// https://nuxt.com/docs/api/configuration/nuxt-config
const rpcTarget = process.env.RPC_URL || "http://127.0.0.1:8545";
const bundlerTarget = process.env.BUNDLER_URL || "http://127.0.0.1:4337";

export default defineNuxtConfig({
  // Wallet code must never run on a server.
  ssr: false,

  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "Jeong Wallet",
      meta: [{ name: "description", content: "A passkey smart account wallet on a local fork." }],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    },
  },

  runtimeConfig: {
    public: {
      // Same-origin paths, proxied to anvil and alto in dev (Alto sends no CORS headers).
      rpcUrl: "/rpc",
      bundlerUrl: "/bundler",
      // Origins that may talk to /connect (M6).
      allowedOrigins: "http://localhost:3001",
    },
  },

  // Pre-bundle heavy deps so the dev server doesn't reload the page the first time they're imported.
  vite: {
    optimizeDeps: {
      include: [
        "viem",
        "viem/chains",
        "viem/accounts",
        "viem/account-abstraction",
        "idb-keyval",
        "@vueuse/core",
        "qrcode",
      ],
    },
  },

  nitro: {
    devProxy: {
      "/rpc": { target: rpcTarget, changeOrigin: true },
      "/bundler": { target: bundlerTarget, changeOrigin: true },
    },
  },

  fonts: {
    families: [
      // Gaegu is a Korean handwriting font: load its Korean subset too, for 정.
      { name: "Gaegu", weights: [400, 700], provider: "google", subsets: ["latin", "korean"] },
      { name: "Caveat", weights: [400, 500, 600, 700], provider: "google" },
      { name: "Inter", weights: [400, 500, 600, 700], provider: "google" },
      { name: "JetBrains Mono", weights: [400, 500], provider: "google" },
    ],
  },

  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
});
