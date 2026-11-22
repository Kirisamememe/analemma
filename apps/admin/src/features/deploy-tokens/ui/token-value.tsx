import { type ReactNode, useId } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const tokenValue = tv({
  slots: {
    root: "flex flex-col gap-1.5",
    label: "text-fg",
    value:
      "block rounded-control border border-line bg-surface-sunken px-3 py-2 wrap-anywhere text-fg select-all",
  },
});

const { root, label: labelSlot, value: valueSlot } = tokenValue();

/** トークンの値の表示に渡す値。 */
type TokenValueProps = {
  /** 値の上に出す、figcaption の文。 */
  label: string;
  /** 表示するトークンの値。 */
  value: string;
};

/** 発行したトークンの値を、等幅の字体で、1回の選択で全体を選べるように表示する。 */
export const TokenValue = ({ label, value }: TokenValueProps): ReactNode => {
  const labelId = useId();

  return (
    <figure aria-labelledby={labelId} className={root()}>
      <figcaption
        className={labelSlot({ className: typography({ role: "label" }) })}
        id={labelId}
      >
        {label}
      </figcaption>
      <code className={valueSlot({ className: typography({ role: "body" }) })}>
        {value}
      </code>
    </figure>
  );
};
