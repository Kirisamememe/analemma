import { tv } from "@/ui/tv";

export const { root: fieldRoot, control: fieldControl } = tv({
  slots: {
    root: "flex flex-col gap-1.5",
    control:
      "w-full rounded-control border border-line-strong bg-surface text-fg shadow-control outline-hidden is-focused:focus-ring is-invalid:border-danger not-forced-colors:is-invalid:outline-danger is-disabled:state-disabled",
  },
})();
