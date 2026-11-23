import { tv } from "@/ui/tv";

export const navItem = tv({
  base: [
    "relative flex h-control w-full items-center justify-start gap-2",
    "rounded-control px-3 text-left text-fg-muted transition",
    "is-hovered:state-hover is-hovered:text-fg is-focus-shown:focus-ring",
  ],
  variants: {
    current: {
      true: [
        "bg-surface text-fg shadow-control",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-control after:outline after:outline-fg/10 forced-colors:after:outline-line is-hovered:after:outline-fg/20",
      ],
    },
    opensList: {
      true: "is-expanded:state-hover is-expanded:text-fg", // 開いている間も押した状態が続くので、沈めない
      false: "is-pressed:state-pressed",
    },
  },
  defaultVariants: { opensList: false },
});
