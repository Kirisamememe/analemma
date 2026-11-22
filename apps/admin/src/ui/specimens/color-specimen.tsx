import type { ReactNode } from "react";

import { Heading } from "../layout/heading";
import { Text } from "../layout/text";
import { tv } from "../tv";

const swatch = tv({
  base: "size-control shrink-0 rounded-control border",
  variants: {
    color: {
      canvas: "bg-canvas",
      surface: "bg-surface",
      "surface-sunken": "bg-surface-sunken",
      fg: "bg-fg",
      "fg-muted": "bg-fg-muted",
      line: "bg-line",
      focus: "bg-focus",
      primary: "bg-primary",
      "on-primary": "bg-on-primary",
      "danger-strong": "bg-danger-strong",
      "on-danger-strong": "bg-on-danger-strong",
      info: "bg-info",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      scrim: "bg-scrim",
      "on-media": "bg-on-media",
    },
  },
});

const panel = tv({
  base: "flex min-w-0 grow flex-col gap-4 rounded-surface border bg-canvas p-6",
  variants: {
    scheme: { light: "scheme-light", dark: "scheme-dark" },
  },
});

/** theme.css の色の名前。 */
type SwatchColor = keyof typeof swatch.variants.color;

/** 色の種類と、その種類の色。 */
type ColorGroup = {
  /** 種類の名前。 */
  readonly name: string;
  /** その種類の色。 */
  readonly colors: readonly SwatchColor[];
};

const GROUPS: readonly ColorGroup[] = [
  { name: "面", colors: ["canvas", "surface", "surface-sunken"] },
  { name: "文字と線", colors: ["fg", "fg-muted", "line", "focus"] },
  {
    name: "塗り",
    colors: ["primary", "on-primary", "danger-strong", "on-danger-strong"],
  },
  { name: "意味", colors: ["info", "success", "warning", "danger"] },
  { name: "light と dark で変わらない", colors: ["scrim", "on-media"] },
];

const SCHEMES = ["light", "dark"] as const;

/** theme.css の色を、light と dark で並べた見本。 */
export const ColorSpecimen = (): ReactNode => (
  <div className="flex flex-wrap gap-6">
    {SCHEMES.map((scheme) => (
      <section aria-label={scheme} className={panel({ scheme })} key={scheme}>
        <Heading level={2}>{scheme}</Heading>
        {GROUPS.map(({ name, colors }) => (
          <div className="flex flex-col gap-2" key={name}>
            <Text tone="muted" variant="caption">
              {name}
            </Text>
            <ul className="grid grid-cols-thumbnails gap-3">
              {colors.map((color) => (
                <li className="flex items-center gap-3" key={color}>
                  <span className={swatch({ color })} />
                  <Text as="span" variant="caption">
                    {color}
                  </Text>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    ))}
  </div>
);
