import { expect, test } from "bun:test";

import { lintFixture } from "../fixture-lint";

test.each([
  {
    label:
      "React から名前や別名で import した effect と default import の effect",
    file: "src/raw-effects.tsx",
    lines: [10, 11, 12, 13, 19],
  },
  {
    label: "一覧にある hook の中の、入れ子のコールバックにある effect",
    file: "src/nested-effect.tsx",
    lines: [8],
  },
  {
    label: ".storybook で namespace import から呼ぶ effect",
    file: ".storybook/story-hook.tsx",
    lines: [5],
  },
])("$label に診断を出すこと", ({ file, lines }) => {
  const { diagnostics } = lintFixture(`invalid/apps/admin/${file}`);

  expect<readonly number[]>(
    diagnostics
      .filter(({ code }) => code === "project(no-effect-outside-allowed-hook)")
      .map(({ line }) => line)
      .toSorted((left, right) => left - right),
  ).toEqual(lines);
});
