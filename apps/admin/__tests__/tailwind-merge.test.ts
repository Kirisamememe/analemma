import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { merge } from "../src/ui/tv";

const theme = await readFile(
  new URL("../src/ui/theme.css", import.meta.url),
  "utf8",
);

const namesOf = (prefix: string): string[] => [
  ...new Set(
    [
      ...theme.matchAll(
        new RegExp(`^\\s*--${prefix}-(?<name>[a-z0-9\\-]+):`, "gmv"),
      ),
    ].map(({ groups }) => groups?.["name"] ?? ""),
  ),
];

const UTILITIES = [...theme.matchAll(/^@utility (?<name>[a-z0-9\-]+)/gmv)].map(
  ({ groups }) => groups?.["name"] ?? "",
);

/** theme.css の変数の名前と、それを使う utility。 */
type ThemeGroup = {
  /** theme.css の変数の、名前の前の部分。 */
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

const UTILITY_PARTNERS: Readonly<Record<string, string | null>> = {
  "h-control": "h-full",
  "h-control-sm": "h-full",
  "size-icon": "size-full",
  "size-control": "size-full",
  "object-focal": "object-center",
  "w-sidebar": "w-full",
  "state-hover": "state-pressed",
  "state-pressed": "state-hover",
  "state-disabled": null,
  "focus-ring": "focus-ring-inset",
  "focus-ring-inset": "focus-ring",
  "scheme-dark": "scheme-light",
  "scheme-light": "scheme-dark",
};

describe("theme.css の名前の merge", () => {
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

  test("文字の色と、文字の大きさと行間の組は、別の組として両方残る", () => {
    expect(merge("text-fg text-base/2xl")).toBe("text-fg text-base/2xl");
    expect(merge("text-xs/lg text-canvas")).toBe("text-xs/lg text-canvas");
  });

  test("theme.css の utility には、どれも merge の組を決めてある", () => {
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

  test("state-disabled は、hover や押した状態の class を消さない", () => {
    expect(merge("state-hover state-disabled")).toBe(
      "state-hover state-disabled",
    );
  });
});
