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
      label: "名前が use- で始まり、関数を2つ export するファイル",
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

const multipleComponentsIn = (file: string): number =>
  lintFixture(file).diagnostics.filter(
    ({ code }) => code === "react(no-multi-comp)",
  ).length;

describe("1ファイルに component を1つ", () => {
  test.each(["patterns", "primitives/overlays", "layout"])(
    "ルールを掛けた ui/%s の .tsx に、export しない補助の component があれば診断を出すこと",
    (folder) => {
      expect(
        multipleComponentsIn(
          `invalid/apps/admin/src/ui/${folder}/two-components.tsx`,
        ),
      ).toBe(1);
    },
  );

  test.each([
    "invalid/apps/admin/src/ui/patterns/__stories__/two-components.stories.tsx",
    "valid/apps/admin/src/ui/patterns/__tests__/one-component.test.tsx",
    "valid/apps/admin/src/ui/patterns/one-component.tsx",
  ])("%s には診断を出さないこと", (file) => {
    expect(multipleComponentsIn(file)).toBe(0);
  });
});

test("React の書き方をそろえるルールが、当たる書き方ごとに診断を出すこと", () => {
  const { diagnostics } = lintFixture(
    "invalid/apps/admin/src/ui/patterns/strict-react.tsx",
  );

  const codes = new Set(diagnostics.map(({ code }) => code));

  expect(
    [
      "function-component-definition",
      "jsx-boolean-value",
      "jsx-curly-brace-presence",
      "jsx-fragments",
      "jsx-max-depth",
      "jsx-no-literals",
      "no-clone-element",
      "no-react-children",
      "no-unknown-property",
      "prefer-function-component",
      "self-closing-comp",
    ].filter((rule) => !codes.has(`react(${rule})`)),
  ).toEqual([]);
});

const literalsIn = (file: string): readonly number[] =>
  lintFixture(file)
    .diagnostics.filter(({ code }) => code === "react(jsx-no-literals)")
    .map(({ line }) => line);

test("文言を受け取る属性に直接書いた文言を止め、class や空の alt は止めないこと", () => {
  expect(
    literalsIn("invalid/apps/admin/src/ui/patterns/strict-react.tsx"),
  ).toEqual([31, 32]);
  expect(
    literalsIn("valid/apps/admin/src/ui/patterns/one-component.tsx"),
  ).toEqual([]);
});

const tooDeepIn = (file: string): number =>
  lintFixture(
    `invalid/apps/admin/src/features/depth/${file}`,
  ).diagnostics.filter(({ code }) => code === "react(jsx-max-depth)").length;

test("JSX の深さは、部品を組むだけの場所では5段まで、見た目の class を書ける場所では6段までにすること", () => {
  expect(tooDeepIn("six-deep.tsx")).toBe(1);
  expect(tooDeepIn("ui/six-deep.tsx")).toBe(0);
});
