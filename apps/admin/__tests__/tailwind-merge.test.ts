import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { merge, tv } from "../src/ui/tv";

const css = (
  await Promise.all(
    ["theme.css", "animation.css"].map((file) =>
      readFile(new URL(`../src/ui/${file}`, import.meta.url), "utf8"),
    ),
  )
).join("\n");

const namesOf = (prefix: string): string[] => [
  ...new Set(
    [
      ...css.matchAll(
        new RegExp(`^\\s*--${prefix}-(?<name>[a-z0-9\\-]+):`, "gmv"),
      ),
    ].map(({ groups }) => groups?.["name"] ?? ""),
  ),
];

const UTILITIES = [...css.matchAll(/^@utility (?<name>[a-z0-9\-]+)/gmv)].map(
  ({ groups }) => groups?.["name"] ?? "",
);

/** デザインシステムの変数の名前と、それを使う utility。 */
type ThemeGroup = {
  /** デザインシステムの変数の、名前の前の部分。 */
  readonly variable: string;
  /** class の、名前の前の部分。 */
  readonly utility: string;
  /** class の、名前の後ろの部分。 */
  readonly suffix?: string;
};

const THEME_GROUPS: readonly ThemeGroup[] = [
  { variable: "color", utility: "bg" },
  { variable: "color", utility: "text" },
  { variable: "text", utility: "text", suffix: "/xl" },
  { variable: "radius", utility: "rounded" },
  { variable: "shadow", utility: "shadow" },
  { variable: "z-index", utility: "z" },
  { variable: "container", utility: "max-w" },
  { variable: "transition-duration", utility: "duration" },
  { variable: "ease", utility: "ease" },
  { variable: "animate", utility: "animate" },
];

/** デザインシステムに名前が1つしかない変数と、組の相手の class。 */
type SingleNameGroup = {
  /** デザインシステムの変数の、名前の前の部分。 */
  readonly variable: string;
  /** class の、名前の前の部分。 */
  readonly utility: string;
  /** 同じ組の、Tailwind CSS の class。 */
  readonly partner: string;
};

const SINGLE_NAME_GROUPS: readonly SingleNameGroup[] = [
  {
    variable: "grid-template-columns",
    utility: "grid-cols",
    partner: "grid-cols-2",
  },
  { variable: "aspect", utility: "aspect", partner: "aspect-square" },
];

const UTILITY_PARTNERS: Readonly<Record<string, string | null>> = {
  "h-control": "h-full",
  "h-control-sm": "h-full",
  "size-icon": "size-full",
  "size-control": "size-full",
  "object-focal": "object-center",
  "w-sidebar": "w-full",
  "state-hover": null,
  "state-pressed": "translate-none",
  "state-disabled": null,
  "focus-ring": "focus-ring-inset",
  "focus-ring-inset": "focus-ring",
  "focus-ring-current": "focus-ring",
  "scheme-dark": "scheme-light",
  "scheme-light": "scheme-dark",
  "scheme-inverse": "scheme-dark",
  "dialog-backdrop-animation": null,
  "dialog-panel-animation": null,
  "nav-drawer-panel-animation": null,
  "toast-animation": null,
};

describe("デザインシステムの class の merge", () => {
  test.each(THEME_GROUPS)(
    "--$variable-* の名前の $utility-* は、同じ組の2つを渡すと後だけが残る",
    ({ variable, utility, suffix = "" }) => {
      const names = namesOf(variable);
      const classOf = (name: string): string => `${utility}-${name}${suffix}`;

      expect(names.length).toBeGreaterThan(1);
      expect(
        names.map((name, index) =>
          merge(`${classOf(names.at(index - 1) ?? "")} ${classOf(name)}`),
        ),
      ).toEqual(names.map((name) => classOf(name)));
    },
  );

  test.each(SINGLE_NAME_GROUPS)(
    "--$variable-* の名前の $utility-* は、$partner と組になり、後だけが残る",
    ({ variable, utility, partner }) => {
      const names = namesOf(variable);

      expect(names.length).toBeGreaterThan(0);
      expect(
        names.flatMap((name) => [
          merge(`${partner} ${utility}-${name}`),
          merge(`${utility}-${name} ${partner}`),
        ]),
      ).toEqual(names.flatMap((name) => [`${utility}-${name}`, partner]));
    },
  );

  test("tv の variant も、theme.css の名前で merge する", () => {
    const layer = tv({
      base: "z-sticky",
      variants: { raised: { true: "z-overlay" } },
    });

    expect(layer({ raised: true })).toBe("z-overlay");
  });

  test("文字の色と、文字の大きさと行間の組は、別の組として両方残る", () => {
    expect(merge("text-fg text-base/2xl")).toBe("text-fg text-base/2xl");
    expect(merge("text-xs/lg text-canvas")).toBe("text-xs/lg text-canvas");
  });

  test("デザインシステムの utility には、どれも merge の組を決めてある", () => {
    expect(UTILITIES.toSorted()).toEqual(
      Object.keys(UTILITY_PARTNERS).toSorted(),
    );
  });

  test.each(
    Object.entries(UTILITY_PARTNERS).flatMap(([name, partner]) =>
      partner === null ? [] : [{ name, partner }],
    ),
  )("$partner の後の $name だけが残る", ({ name, partner }) => {
    expect(merge(`${partner} ${name}`)).toBe(name);
  });

  test("state-disabled は、hover や pressed の class を消さない", () => {
    expect(merge("state-hover state-pressed state-disabled")).toBe(
      "state-hover state-pressed state-disabled",
    );
  });

  test("state-pressed の後で translate を指定すると、後の位置が残る", () => {
    expect(merge("state-pressed translate-none")).toBe("translate-none");
  });
});
