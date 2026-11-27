import { type ReactNode, useContext } from "react";
import { Input, NumberFieldStateContext } from "react-aria-components";

import { typography } from "@/ui/typography";

/** 数値を打ち込む入力欄に渡す値。 */
type NumberInputProps = {
  /** フォームが持つ確定済みの数値。 */
  committed: number | undefined;
};

/** 確定前の入力を見分けられる、数値を打ち込む入力欄。 */
export const NumberInput = ({ committed }: NumberInputProps): ReactNode => {
  const state = useContext(NumberFieldStateContext);

  const uncommitted =
    committed !== undefined &&
    state !== null &&
    (!Object.is(committed, state.numberValue) ||
      (Number.isNaN(committed) && state.inputValue !== ""));

  return (
    <Input
      data-uncommitted-input={uncommitted || undefined}
      className={typography({
        role: "body",
        className:
          "min-w-0 flex-1 px-3 @max-3xs/nested-form:px-1 tabular-nums outline-hidden",
      })}
    />
  );
};
