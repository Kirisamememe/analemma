import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { ColorSpecimen } from "@/ui/specimens/color-specimen";

afterEach(cleanup);

const theme = await readFile(
  new URL("../../theme.css", import.meta.url),
  "utf8",
);

const COLORS = [
  ...new Set(
    [...theme.matchAll(/^\s*--color-(?<name>[a-z0-9\-]+):/gmv)].map(
      ({ groups }) => groups?.["name"] ?? "",
    ),
  ),
].toSorted();

test.each(["light", "dark"])(
  "%s の欄に、theme.css の色をどれも1回ずつ並べる",
  (scheme) => {
    render(<ColorSpecimen />);

    const panel = within(screen.getByRole("region", { name: scheme }));

    expect(COLORS.length).toBeGreaterThan(0);
    expect(
      panel
        .getAllByRole("listitem")
        .map((item) => item.textContent)
        .toSorted(),
    ).toEqual(COLORS);
  },
);
