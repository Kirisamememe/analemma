import type { ReactNode } from "react";
import { CheckboxButton } from "react-aria-components";

import { CheckMark } from "./check-mark";

import { RequiredBadge } from "@/ui/primitives/form-fields/parts/required-badge";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const checkboxBox = tv({
  base: [
    "flex size-icon items-center justify-center",
    "rounded-xs border border-line-strong bg-surface shadow-control transition",
    "group-is-hovered:state-hover group-is-focus-shown:focus-ring group-is-pressed:state-pressed",
    "group-is-selected:border-primary group-is-selected:bg-primary group-is-selected:text-on-primary",
    "group-is-invalid:border-danger not-forced-colors:group-is-invalid:outline-danger",
  ],
});

type CheckboxControlProps = {
  /** チェックに添えるラベル。 */
  label?: string;
  /** チェックが必須か。 */
  isRequired?: boolean | undefined;
};

/** チェックを切り替えるボタン。 */
export const CheckboxControl = ({
  label,
  isRequired = false,
}: CheckboxControlProps): ReactNode => {
  const showRequired = label !== undefined && isRequired;

  return (
    <CheckboxButton
      className={typography({
        role: "label",
        className:
          "group flex items-start gap-2 py-0.5 text-fg is-disabled:state-disabled",
      })}
    >
      <span aria-hidden="true" className="flex h-5 shrink-0 items-center">
        <span className={checkboxBox()}>
          <CheckMark />
        </span>
      </span>
      {label !== undefined && (
        <span className="min-w-0 wrap-anywhere">{label}</span>
      )}
      {showRequired && <RequiredBadge />}
    </CheckboxButton>
  );
};
