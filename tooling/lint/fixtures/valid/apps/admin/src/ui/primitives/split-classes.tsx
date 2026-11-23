import { merge, tv } from "../tv";

const pressable = tv({
  base: [
    "flex size-10 shrink-0 items-center justify-center",
    "rounded-control text-fg outline-hidden transition",
  ],
  variants: { current: { true: "bg-surface" } },
});

/** class を、8個までの文字列に分けて書いた部品。 */
export const SplitClasses = () => (
  <button
    aria-label="押す と 左 から ナビ が 出て 中 の リンク を 選べる"
    className={pressable({
      className: ["is-hovered:state-hover", "is-focus-shown:focus-ring"],
    })}
    type="button"
  >
    <span className="flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden" />
  </button>
);

type Props = {
  /** ボタンの文言。 */
  label: string;
  /** 部品に足す class。 */
  contentClassName?: string;
};

/** 文言に応じて class を選ぶ部品。 */
export const Defaults = ({
  label,
  contentClassName = "flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden",
}: Props) => (
  <span
    className={pressable({
      current: label === "This is a label with exactly nine words here",
      className: merge(
        `flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden ${contentClassName}`,
      ),
    })}
  />
);
