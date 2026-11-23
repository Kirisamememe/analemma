import { tv } from "../tv";

const pressable = tv({
  base: "flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden transition",
  variants: {
    isCurrent: {
      true: "relative bg-surface text-fg shadow-control after:pointer-events-none after:absolute after:inset-0 after:rounded-control after:outline",
    },
  },
});

const stacked = tv({
  base: [
    "flex flex-col gap-2",
    "flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden transition",
  ],
});

/** 1つの文字列に、class を9個以上書いた部品。 */
export const LongClasses = () => (
  <div className={stacked()}>
    <span className="flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden transition" />
    <span
      className={pressable({
        className:
          "flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden transition",
      })}
    />
    <span className={pressable({ isCurrent: true })} />
  </div>
);
