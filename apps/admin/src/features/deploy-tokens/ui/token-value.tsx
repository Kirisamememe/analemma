import { type ReactNode, useId } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const tokenValue = tv({
  slots: {
    root: "flex flex-col gap-1.5",
    label: "wrap-anywhere text-fg",
    value:
      "block field-sizing-content w-full resize-none rounded-control border bg-surface-sunken px-3 py-2 font-mono wrap-anywhere text-fg outline-hidden focus-visible:focus-ring",
  },
});

const { root, label: labelSlot, value: valueSlot } = tokenValue();

/** トークンの値の表示に渡す値。 */
type TokenValueProps = {
  /** 値の上に出す、ラベルの文。 */
  label: string;
  /** 表示するトークンの値。 */
  value: string;
};

/** 発行したトークンの値を、等幅の字体で、focus したら全体を選ぶ読み取り専用の欄に出す。 */
export const TokenValue = ({ label, value }: TokenValueProps): ReactNode => {
  const id = useId();

  return (
    <div className={root()}>
      <label
        className={labelSlot({ className: typography({ role: "label" }) })}
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        className={valueSlot({ className: typography({ role: "body" }) })}
        id={id}
        onFocus={(event) => {
          event.currentTarget.select();
        }}
        readOnly
        spellCheck={false}
        value={value}
      />
    </div>
  );
};
