/** Open state for the shared Add / Rename account modal (rendered once in the wallet layout). */
export function useAccountModal() {
  const state = useState<{ open: boolean; mode: "add" | "rename"; index?: number }>(
    "account-modal",
    () => ({
      open: false,
      mode: "add",
    }),
  );
  return {
    state,
    openAdd: () => (state.value = { open: true, mode: "add" }),
    openRename: (index: number) => (state.value = { open: true, mode: "rename", index }),
    close: () => (state.value = { ...state.value, open: false }),
  };
}
