import { describe, expect, test } from "bun:test";

import { lintFixture } from "../fixture-lint";

test.each([
  {
    label:
      "React から名前や別名で import した effect と、default import した React から呼ぶ effect",
    file: "src/raw-effects.ts",
    lines: [10, 11, 12, 13, 19],
  },
  {
    label: "一覧にある hook の中の、入れ子の関数にある effect",
    file: "src/nested-effect.ts",
    lines: [8],
  },
  {
    label: ".storybook で namespace import から呼ぶ effect",
    file: ".storybook/story-hook.ts",
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

describe("React の import", () => {
  test.each([
    { label: "hook でも context でもない .ts", file: "plain-logic.ts" },
    {
      label: "関数を2つ export する hook のファイル",
      file: "use-two-hooks.ts",
    },
    {
      label: "use で始まらない関数を export する hook のファイル",
      file: "use-misnamed.ts",
    },
    {
      label: "hook も export する context のファイル",
      file: "open-context.ts",
    },
  ])("$label の、React の値の import に診断を出すこと", ({ file }) => {
    const { diagnostics } = lintFixture(
      `invalid/apps/admin/src/react-imports/${file}`,
    );

    expect(
      diagnostics.filter(({ code }) => code === "project(no-react-in-logic)"),
    ).toHaveLength(1);
  });
});
