import type { ReactNode } from "react";
import {
  TextField as AriaTextField,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";

import { tv } from "../tv";
import { typography } from "../typography";

const field = tv({
  slots: {
    root: "flex flex-col gap-1.5",
    label: "text-fg",
    input:
      "h-control w-full rounded-control border border-line bg-surface px-3 text-fg shadow-control outline-hidden is-focused:focus-ring is-invalid:border-danger is-disabled:state-disabled",
    description: "text-fg-muted",
    error: "text-danger",
  },
});

const { root, label, input, description, error } = field();

/** 1行の入力欄に渡す値。 */
type TextFieldProps = {
  /** 入力欄の名前(フォームのキー)。 */
  readonly name: string;
  /** 入力欄のラベル。 */
  readonly label: string;
  /** 入力欄の補足。 */
  readonly description?: string;
  /** 入力が要るか。 */
  readonly isRequired?: boolean;
  /** 文字の数の上限。 */
  readonly maxLength?: number;
  /** ブラウザの自動入力の種類。 */
  readonly autoComplete?: string;
  /** 最初に入れておく値。 */
  readonly defaultValue?: string;
};

/** ラベルと補足と誤りの知らせを持つ、1行の入力欄。 */
export const TextField = ({
  name,
  label: title,
  description: help,
  isRequired = false,
  maxLength,
  autoComplete,
  defaultValue = "",
}: TextFieldProps): ReactNode => (
  <AriaTextField
    className={root()}
    defaultValue={defaultValue}
    isRequired={isRequired}
    name={name}
  >
    <Label className={label({ className: typography({ role: "label" }) })}>
      {title}
    </Label>
    <Input
      autoComplete={autoComplete}
      className={input({ className: typography({ role: "body" }) })}
      maxLength={maxLength}
    />
    {help !== undefined && (
      <Text
        className={description({ className: typography({ role: "caption" }) })}
        slot="description"
      >
        {help}
      </Text>
    )}
    <FieldError
      className={error({ className: typography({ role: "caption" }) })}
    />
  </AriaTextField>
);
