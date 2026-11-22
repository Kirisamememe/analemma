import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import { ColorSpecimen } from "../color-specimen";

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
];

test("theme.css の色を、どれも light と dark の両方に並べる", () => {
  render(<ColorSpecimen />);

  expect(COLORS.length).toBeGreaterThan(0);
  expect(
    COLORS.filter((color) => screen.queryAllByText(color).length !== 2),
  ).toEqual([]);
  expect(screen.getAllByRole("listitem")).toHaveLength(COLORS.length * 2);
});
