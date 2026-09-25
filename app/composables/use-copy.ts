export function useCopy() {
  const toast = useToast();
  async function copy(text: string, title = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      toast.add({
        title,
        description: text.length > 48 ? shortHash(text) : text,
        icon: "i-lucide-clipboard-check",
        color: "success",
        duration: 1800,
      });
    } catch {
      toast.add({
        title: "Couldn't copy",
        description: "Clipboard access was blocked.",
        color: "error",
      });
    }
  }
  return { copy };
}
