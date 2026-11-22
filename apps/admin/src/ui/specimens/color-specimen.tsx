import type { ReactNode } from "react";

import { Heading } from "@/ui/layout/heading";
import { Text } from "@/ui/layout/text";
import { tv } from "@/ui/tv";

const swatch = tv({
  base: "size-control shrink-0 rounded-control outline -outline-offset-1 outline-fg/10",
  variants: {
    color: {
      canvas: "bg-canvas",
      surface: "bg-surface",
      "surface-sunken": "bg-surface-sunken",
      fg: "bg-fg",
      "fg-muted": "bg-fg-muted",
      line: "bg-line",
      "line-strong": "bg-line-strong",
      focus: "bg-focus",
      primary: "bg-primary",
      "on-primary": "bg-on-primary",
      "danger-strong": "bg-danger-strong",
      "on-danger-strong": "bg-on-danger-strong",
      info: "bg-info",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      "on-info": "bg-on-info",
      "on-success": "bg-on-success",
      "on-warning": "bg-on-warning",
      "on-danger": "bg-on-danger",
      scrim: "bg-scrim",
      "on-media": "bg-on-media",
    },
  },
});

const panel = tv({
  base: "flex min-w-0 grow flex-col gap-4 rounded-surface bg-canvas p-6 outline outline-fg/10",
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
  {
    name: "文字と線",
    colors: ["fg", "fg-muted", "line", "line-strong", "focus"],
  },
  {
    name: "塗り",
    colors: ["primary", "on-primary", "danger-strong", "on-danger-strong"],
  },
  {
    name: "意味",
    colors: [
      "info",
      "on-info",
      "success",
      "on-success",
      "warning",
      "on-warning",
      "danger",
      "on-danger",
    ],
  },
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
