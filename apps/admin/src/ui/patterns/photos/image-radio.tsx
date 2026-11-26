import type { ComponentProps, ReactNode } from "react";

import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const radio = tv({
  slots: {
    mark: [
      "pointer-events-none absolute inset-e-2 top-2 grid size-6 place-items-center",
      "rounded-full bg-surface text-fg shadow-control",
      "opacity-0 transition-opacity group-hover:opacity-100 group-has-focus-visible:opacity-100 pointer-coarse:opacity-100",
      "forced-colors:outline",
    ],
  },
  variants: {
    checked: {
      true: {
        mark: "border-2 border-current bg-success text-on-media opacity-100",
      },
    },
  },
});

/** 写真の上に選択状態を表示する radio。 */
export const ImageRadio = ({
  checked = false,
  disabled,
  name,
  id,
  ref,
  onChange,
}: Pick<
  ComponentProps<"input">,
  "checked" | "disabled" | "id" | "name" | "ref" | "onChange"
>): ReactNode => (
  <>
    <input
      className="sr-only"
      checked={checked}
      disabled={disabled}
      id={id}
      name={name}
      ref={ref}
      type="radio"
      onChange={onChange}
    />
    <span aria-hidden="true" className={radio({ checked }).mark()}>
      {checked && (
        <span className="text-on-success">
          <Icon name="check" size="sm" weight="bold" />
        </span>
      )}
    </span>
  </>
);

/** フッターで長いタイトルを1行に収め、選択が変わったことを知らせる。 */
export const ImageSelectionStatus = ({
  label,
}: Readonly<Record<"label", string>>): ReactNode => (
  <output className={status()} title={label}>
    {label}
  </output>
);

const status = tv({
  base: [
    "max-w-48 truncate rounded-control bg-surface px-2 py-1 text-fg-muted md:max-w-80",
    typography({ role: "caption" }),
  ],
});
