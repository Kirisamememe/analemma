import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const theme = await readFile(
  new URL("../src/ui/theme.css", import.meta.url),
  "utf8",
);

const AA = 4.5;
const SCHEMES = ["light", "dark"] as const;
const SURFACES = ["canvas", "surface", "surface-sunken"] as const;
const MEANINGS = ["info", "success", "warning", "danger"] as const;
const TINT = 0.1;

/** sRGB の、0〜1 の光の強さ(gamma を外した値)。 */
type LinearRgb = readonly [number, number, number];

/** light と dark の、どちらの色か。 */
type Scheme = (typeof SCHEMES)[number];

/** 下の色の上に、透明度を付けて重ねる色。 */
type Layer = {
  /** 重ねる色。 */
  readonly color: LinearRgb;
  /** 不透明度(0〜1)。 */
  readonly alpha: number;
};

const definitionsOf = (prefix: string): Map<string, string> => {
  const definitions = new Map<string, string>();

  for (const { groups } of theme.matchAll(
    new RegExp(`--${prefix}-(?<name>[a-z0-9\\-]+):\\s*(?<value>[^;]+);`, "gv"),
  )) {
    const name = groups?.["name"] ?? "";

    if (!definitions.has(name)) {
      definitions.set(name, (groups?.["value"] ?? "").trim());
    }
  }

  return definitions;
};

const palette = definitionsOf("palette");
const colors = definitionsOf("color");

const clamp = (channel: number): number => Math.min(1, Math.max(0, channel));

const fromOklch = (value: string): LinearRgb => {
  const match = /^oklch\((?<l>[\d.]+) (?<c>[\d.]+) (?<h>[\d.]+)\)$/v.exec(
    value,
  );

  if (match === null) {
    throw new Error(`oklch() で書いていない色です: ${value}`);
  }

  const lightness = Number(match.groups?.["l"]);
  const chroma = Number(match.groups?.["c"]);
  const hue = (Number(match.groups?.["h"]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3;
  const m = (lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3;
  const s = (lightness - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3;

  return [
    clamp(4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s),
    clamp(-1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s),
    clamp(-0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s),
  ];
};

const resolve = (value: string): LinearRgb => {
  const variable = /^var\(--palette-(?<name>[a-z0-9\-]+)\)$/v.exec(value);

  return fromOklch(
    variable === null
      ? value
      : (palette.get(variable.groups?.["name"] ?? "") ?? ""),
  );
};

const colorOf = (name: string, scheme: Scheme): LinearRgb => {
  const value = colors.get(name) ?? "";
  const both = /^light-dark\((?<light>[^,]+),(?<dark>[^,]+)\)$/v.exec(value);

  return resolve((both?.groups?.[scheme] ?? value).trim());
};

const encode = (channel: number): number =>
  channel <= 0.003_130_8
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;

const decode = (channel: number): number =>
  channel <= 0.040_45 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const over = ({ color, alpha }: Layer, base: LinearRgb): LinearRgb => [
  decode(alpha * encode(color[0]) + (1 - alpha) * encode(base[0])),
  decode(alpha * encode(color[1]) + (1 - alpha) * encode(base[1])),
  decode(alpha * encode(color[2]) + (1 - alpha) * encode(base[2])),
];

const luminance = ([r, g, b]: LinearRgb): number =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

const contrast = (first: LinearRgb, second: LinearRgb): number => {
  const [one, other] = [luminance(first), luminance(second)];

  return (Math.max(one, other) + 0.05) / (Math.min(one, other) + 0.05);
};

const HOVER =
  Number(
    /@utility state-hover \{[^\}]*currentColor (?<percent>\d+)%/v.exec(theme)
      ?.groups?.["percent"],
  ) / 100;

const FILLS = [...colors.keys()].flatMap((name) => {
  const fill = name.replace(/^on-/v, "");

  return name.startsWith("on-") && colors.has(fill)
    ? SCHEMES.map((scheme) => ({ text: name, fill, scheme }))
    : [];
});

describe("theme.css の色のコントラスト(WCAG の AA)", () => {
  test("塗りと、その上の文字の組(on-*)を読み取れている", () => {
    expect(FILLS.map(({ fill }) => fill)).toContain("danger-strong");
    expect(HOVER).toBeGreaterThan(0);
  });

  test.each(FILLS)(
    "$scheme の $fill の塗りの上で、$text の文字が 4.5:1 に届く(hover の重ねも)",
    ({ text, fill, scheme }) => {
      const foreground = colorOf(text, scheme);
      const background = colorOf(fill, scheme);

      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(AA);
      expect(
        contrast(
          foreground,
          over({ color: foreground, alpha: HOVER }, background),
        ),
      ).toBeGreaterThanOrEqual(AA);
    },
  );

  test.each(
    MEANINGS.flatMap((meaning) =>
      SCHEMES.flatMap((scheme) =>
        SURFACES.map((surface) => ({ meaning, scheme, surface })),
      ),
    ),
  )(
    "$scheme の $surface の上で、$meaning の文字が、地と /10 の薄い面の両方に 4.5:1 で届く",
    ({ meaning, scheme, surface }) => {
      const foreground = colorOf(meaning, scheme);
      const background = colorOf(surface, scheme);

      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(AA);
      expect(
        contrast(
          foreground,
          over({ color: foreground, alpha: TINT }, background),
        ),
      ).toBeGreaterThanOrEqual(AA);
    },
  );
});
