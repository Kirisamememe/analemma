import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Icon } from "@/ui/primitives/graphics/icon";

test.each([
  ["xs", 12],
  ["sm", 14],
  ["md", 16],
  ["lg", 20],
  ["xl", 24],
] as const)(
  "%s のアイコンを bold で描くと線の太さが 1.5px になる",
  (size, pixels) => {
    const drawing = renderToStaticMarkup(
      <Icon name="layers" size={size} weight="bold" />,
    );

    const svg = new DOMParser().parseFromString(
      drawing,
      "image/svg+xml",
    ).documentElement;

    const width = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
    const stroke = Number(svg.getAttribute("stroke-width"));
    expect((stroke * pixels) / width).toBeCloseTo(1.5);
  },
);
