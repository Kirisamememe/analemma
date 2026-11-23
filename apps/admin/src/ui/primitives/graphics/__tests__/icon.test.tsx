import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

import { Icon } from "@/ui/primitives/graphics/icon";

const THEME = readFileSync(new URL("../../../theme.css", import.meta.url), {
  encoding: "utf8",
});

const drawnPixels = (variable: string): number => {
  const rem = new RegExp(`${variable}:\\s*([\\d.]+)rem;`, "v").exec(THEME)?.[1];

  if (rem === undefined) throw new Error(`${variable} が theme.css に無い`);

  return Number(rem) * 16;
};

test.each([
  ["xs", "--size-icon-xs"],
  ["sm", "--size-icon-sm"],
  ["md", "--size-icon"],
  ["lg", "--size-icon-lg"],
  ["xl", "--size-icon-xl"],
] as const)(
  "%s のアイコンを bold で描くと、theme.css の大きさで描いた線の太さが 1.5px になる",
  (size, variable) => {
    const drawing = renderToStaticMarkup(
      <Icon name="layers" size={size} weight="bold" />,
    );

    const svg = new DOMParser().parseFromString(
      drawing,
      "image/svg+xml",
    ).documentElement;

    const width = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
    const stroke = Number(svg.getAttribute("stroke-width"));
    expect((stroke * drawnPixels(variable)) / width).toBeCloseTo(1.5);
  },
);
