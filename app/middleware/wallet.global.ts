// /wallet/* and /settings need a stored passkey credential; otherwise go to onboarding.
export default defineNuxtRouteMiddleware(async (to) => {
  const guarded = to.path.startsWith("/wallet") || to.path.startsWith("/settings");
  const smart = useSmartAccounts();
  try {
    await smart.ensureReady();
  } catch {
    // IndexedDB unavailable; treat as no credential
  }
  if (guarded && !usePasskey().credential.value) return navigateTo("/");
});
