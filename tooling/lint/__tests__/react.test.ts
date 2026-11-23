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
    {
      label: "hook でも context でもない .ts",
      file: "plain-logic.ts",
      count: 1,
    },
    {
      label: "自前の hook と、import した React の関数を export するファイル",
      file: "use-imported.ts",
      count: 1,
    },
    {
      label:
        "名前が use- で始まり、satisfies を付けた関数ともう1つの関数を export するファイル",
      file: "use-two-hooks.ts",
      count: 1,
    },
    {
      label:
        "名前が use- で始まり、use で始まらない関数をそのまま export するファイル",
      file: "use-misnamed.ts",
      count: 1,
    },
    {
      label:
        "名前が use- で始まり、use で始まる関数を use で始まらない別名で export するファイル",
      file: "use-renamed.ts",
      count: 1,
    },
    {
      label:
        "名前が use- で始まり、自前の hook を export し、React の関数も re-export するファイル",
      file: "use-reexport.ts",
      count: 2,
    },
    {
      label:
        "名前が -context.ts で終わり、context と hook を export するファイル",
      file: "open-context.ts",
      count: 1,
    },
    {
      label: "名前が -context.ts で終わり、型だけを export するファイル",
      file: "formatter-context.ts",
      count: 1,
    },
  ])(
    "$label の、React の値の import と re-export に診断を出すこと",
    ({ count, file }) => {
      const { diagnostics } = lintFixture(
        `invalid/apps/admin/src/react-imports/${file}`,
      );

      expect(
        diagnostics.filter(({ code }) => code === "project(no-react-in-logic)"),
      ).toHaveLength(count);
    },
  );
});
