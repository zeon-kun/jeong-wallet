export default defineAppConfig({
  ui: {
    colors: {
      primary: "coral",
      neutral: "stone",
    },
    modal: {
      slots: {
        overlay: "bg-ink/40 backdrop-blur-[1px]",
        content:
          "bg-card text-ink ring-0 border-[1.6px] border-sketch rounded-[16px_20px_14px_18px] shadow-[4px_5px_0_var(--jw-shadow)] divide-y-0",
        title: "hand text-xl text-ink",
        description: "text-ink-soft",
      },
    },
    drawer: {
      slots: {
        overlay: "bg-ink/40",
        content: "bg-card text-ink ring-0 border-t-[1.6px] border-sketch",
        handle: "bg-pencil/60",
      },
    },
    popover: {
      slots: {
        content:
          "bg-card ring-0 border-[1.6px] border-sketch rounded-[14px_18px_13px_16px] shadow-[4px_5px_0_var(--jw-shadow)]",
      },
    },
    tooltip: {
      slots: {
        content: "bg-ink text-paper ring-0 font-mono text-xs h-auto py-1",
      },
    },
    toast: {
      slots: {
        root: "bg-card ring-0 border-[1.6px] border-sketch rounded-[12px_16px_11px_14px] shadow-[3px_4px_0_var(--jw-shadow)]",
        title: "hand text-base text-ink",
        description: "text-ink-soft",
      },
    },
  },
});
