import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COLOR_USAGE, TEXT_PAIRS } from "../config/admin-classes";
import { lintFixture, ruleIdsOf } from "../fixture-lint";

const RESTRICTED = "better-tailwindcss(no-restricted-classes)";
const BOUNDARY = "project(styling-boundary)";

/** 診断を出した行と、文言の始まり。 */
type Expected = [line: number, phrase: string];

/** fixture の診断を読む対象。 */
type Query = {
  /** fixture のフォルダから数えたパス。 */
  readonly file: string;
  /** 診断を出したルールの ID。 */
  readonly rule: string;
};

const diagnosticsOf = (
  { file, rule }: Query,
  expected: readonly Expected[],
): Expected[] => {
  const phrases = new Map(expected.map(([line, phrase]) => [line, phrase]));

  return lintFixture(file)
    .diagnostics.filter((diagnostic) => diagnostic.code === rule)
    .map(({ line, message }): Expected => {
      const phrase = phrases.get(line) ?? "";

      return [line, message.startsWith(phrase) ? phrase : message];
    })
    .toSorted(([left], [right]) => left - right);
};

describe("管理画面の部品の class", () => {
  const file = "invalid/apps/admin/src/ui/restricted-classes.tsx";

  test("決まりに合わない class ごとに、決まりの文言で1件ずつ診断を出すこと", () => {
    const expected: Expected[] = [
      [4, "任意の値"],
      [5, "任意の値"],
      [6, "CSS 変数を直接読める"],
      [7, "dark: は使いません"],
      [8, "dark: は使いません"],
      [9, "!(!important)は使いません"],
      [10, "!(!important)は使いません"],
      [11, "状態は theme.css の is-*:"],
      [12, "状態は theme.css の is-*:"],
      [13, "重ね順は"],
      [14, "outline-none の代わりに"],
      [15, "余白は"],
      [16, "余白は"],
      [17, "上下の正の margin は使わず"],
      [18, "space-x/y は使わず"],
      [19, "行間は"],
      [20, "文字の大きさは、行間と組"],
      [21, "文字の大きさと太さは"],
      [22, "文字の大きさと太さは"],
      [23, "theme.css に無い値"],
      [24, "theme.css に無い値"],
      [25, "theme.css に無い値"],
      [26, "面の色"],
      [27, "色の不透明度は"],
      [28, "色の不透明度は"],
      [29, "色の不透明度は"],
      [30, "surface は bg"],
      [31, "focus は class にせず"],
      [32, "focus は class にせず"],
      [33, "状態は theme.css の is-*:"],
      [34, "上下の正の margin は使わず"],
      [35, "文字の大きさは、theme.css の目盛りで"],
      [36, "文字の太さは"],
      [37, "danger-strong は bg"],
      [38, "on-danger-strong は text"],
      [39, "fg-muted は text"],
      [41, "余白は"],
      [42, "余白は"],
      [43, "余白は"],
      [44, "余白は"],
      [45, "余白は"],
    ];

    expect(diagnosticsOf({ file, rule: RESTRICTED }, expected)).toEqual(
      expected,
    );
  });

  test("入力を受ける部品の枠の色(line-strong)は、ui/primitives/ の外の部品で使うと診断を出すこと", () => {
    const outside = [
      "invalid/apps/admin/src/ui/layout/framed.tsx",
      "invalid/apps/admin/src/features/pages/ui/framed-row.tsx",
    ];

    expect(
      outside.map((outsideFile) =>
        diagnosticsOf({ file: outsideFile, rule: RESTRICTED }, [
          [3, "line-strong は、ui/primitives/"],
        ]),
      ),
    ).toEqual(outside.map(() => [[3, "line-strong は、ui/primitives/"]]));
  });

  test("ui/primitives/ の中でも、line-strong は border のほかに使うと診断を出すこと", () => {
    const expected: Expected[] = [
      [4, "line-strong は border"],
      [5, "line-strong は border"],
    ];

    expect(
      diagnosticsOf(
        {
          file: "invalid/apps/admin/src/ui/primitives/strong-fill.tsx",
          rule: RESTRICTED,
        },
        expected,
      ),
    ).toEqual(expected);
  });

  test.each([
    ["ui/primitives/overlays/dialog.tsx", [3, 3, 4, 5, 5, 6, 6, 7, 7, 8]],
    ["ui/primitives/navigation/scroll-view.tsx", [4]],
    ["ui/patterns/photos/image-radio.tsx", [4]],
    ["features/images/ui/upload/photo-drop-hint.tsx", [3, 3, 4, 4, 4]],
    ["ui/primitives/form-fields/choices/checkbox-control.tsx", [3]],
    ["ui/layout/media-layout.ts", [2, 2, 5, 9, 9]],
  ] as const)(
    "装飾の枠や許可した状態以外の線を %s で止めること",
    (path, lines) => {
      const result = lintFixture(`invalid/apps/admin/src/${path}`);
      expect(
        result.diagnostics
          .filter(({ message }) =>
            message.startsWith("線は、写真や色の面と色が喧嘩しない"),
          )
          .map(({ line }) => line)
          .toSorted((a, b) => a - b),
      ).toEqual([...lines]);
    },
  );

  test("theme.css に無い class に診断を出すこと", () => {
    expect(ruleIdsOf(lintFixture(file))).toContain(
      "better-tailwindcss(no-unknown-classes)",
    );
  });

  test("文字の役割の対応では、決めていない大きさと行間の組と、数値の太さに診断を出すこと", () => {
    const expected: Expected[] = [
      [7, "文字の大きさと行間の組は"],
      [8, "文字の大きさと行間の組は"],
      [9, "文字の太さは"],
    ];

    expect(
      diagnosticsOf(
        { file: "invalid/apps/admin/src/ui/typography.ts", rule: RESTRICTED },
        expected,
      ),
    ).toEqual(expected);
  });

  test("style と className と spread の、検査できない形に診断を出すこと", () => {
    const expected: Expected[] = [
      [8, "style に書けるのは"],
      [9, "style には、その場に"],
      [10, "部品の className には"],
      [11, "部品の className には"],
      [12, "JSX の props は spread"],
    ];

    expect(
      diagnosticsOf(
        { file: "invalid/apps/admin/src/ui/styled.tsx", rule: BOUNDARY },
        expected,
      ),
    ).toEqual(expected);
  });
});

describe("プラグインの、制限のほかのルール", () => {
  test("効き目のぶつかり・重なり・古い class・余分な空白・canonical でない class・並びに診断を出すこと", () => {
    const rules = new Set(
      ruleIdsOf(lintFixture("invalid/apps/admin/src/ui/plugin-rules.tsx")),
    );

    expect(
      [
        "no-conflicting-classes",
        "no-duplicate-classes",
        "no-deprecated-classes",
        "no-unnecessary-whitespace",
        "enforce-canonical-classes",
        "enforce-consistent-class-order",
      ].filter((rule) => !rules.has(`better-tailwindcss(${rule})`)),
    ).toEqual([]);
  });
});

describe("class を探す場所", () => {
  test("名前が ClassNames で終わる変数と、merge の呼び出しの class も検査すること", () => {
    const expected: Expected[] = [
      [4, "余白は"],
      [7, "余白は"],
    ];

    expect(
      diagnosticsOf(
        {
          file: "invalid/apps/admin/src/ui/selector-classes.ts",
          rule: RESTRICTED,
        },
        expected,
      ),
    ).toEqual(expected);
  });

  test("名前が ClassName で終わる属性の class も検査すること", () => {
    const expected: Expected[] = [[14, "余白は"]];

    expect(
      diagnosticsOf(
        {
          file: "invalid/apps/admin/src/ui/selector-attribute.tsx",
          rule: RESTRICTED,
        },
        expected,
      ),
    ).toEqual(expected);
  });
});

describe("管理画面の画面のコードの class", () => {
  const file = "invalid/apps/admin/src/routes/styled-screen.tsx";

  test("決めた class の外に、class ごとに診断を出すこと", () => {
    const expected: Expected[] = [
      [5, "画面のコードは"],
      [5, "画面のコードは"],
    ];

    expect(diagnosticsOf({ file, rule: RESTRICTED }, expected)).toEqual(
      expected,
    );
  });

  test("式の className と、style と、spread に診断を出すこと", () => {
    const expected: Expected[] = [
      [6, "画面のコードの className"],
      [7, "style は ui/ の部品"],
      [8, "JSX の props は spread"],
    ];

    expect(diagnosticsOf({ file, rule: BOUNDARY }, expected)).toEqual(expected);
  });

  test("部品の __stories__ でも、画面のコードと同じく、決めた class の外と style に診断を出すこと", () => {
    const stories = "invalid/apps/admin/src/ui/__stories__/styled.stories.tsx";

    const classes: Expected[] = [
      [3, "画面のコードは"],
      [3, "画面のコードは"],
    ];

    const boundary: Expected[] = [[5, "style は ui/ の部品"]];

    expect(diagnosticsOf({ file: stories, rule: RESTRICTED }, classes)).toEqual(
      classes,
    );
    expect(diagnosticsOf({ file: stories, rule: BOUNDARY }, boundary)).toEqual(
      boundary,
    );
  });

  test("色の見本でも、色ごとの決まりのほか(任意の値・文字の役割・面の不透明度)には診断を出すこと", () => {
    const expected: Expected[] = [
      [4, "任意の値"],
      [5, "文字の大きさと太さは"],
      [6, "面の色"],
    ];

    expect(
      diagnosticsOf(
        {
          file: "invalid/apps/admin/src/ui/specimens/loose.tsx",
          rule: RESTRICTED,
        },
        expected,
      ),
    ).toEqual(expected);
  });

  test("feature の ui/ の外では、部品の class に診断を出すこと", () => {
    const expected: Expected[] = [
      [2, "画面のコードは"],
      [2, "画面のコードは"],
      [2, "画面のコードは"],
    ];

    expect(
      diagnosticsOf(
        {
          file: "invalid/apps/admin/src/features/pages/page-screen.tsx",
          rule: RESTRICTED,
        },
        expected,
      ),
    ).toEqual(expected);
  });
});

describe("検査の設定と theme.css", () => {
  const theme = readFileSync(
    join(import.meta.dirname, "../../../apps/admin/src/ui/theme.css"),
    "utf8",
  );

  const namesOf = (prefix: string): string[] => [
    ...new Set(
      [
        ...theme.matchAll(
          new RegExp(`--${prefix}-(?<name>[a-z0-9\\-]+):`, "gv"),
        ),
      ].map(({ groups }) => groups?.["name"] ?? ""),
    ),
  ];

  test("theme.css の色に、どれも使ってよい utility を決めてある", () => {
    expect(Object.keys(COLOR_USAGE).toSorted()).toEqual(
      namesOf("color").toSorted(),
    );
  });

  test("文字の役割の組は、theme.css の目盛りの名前で書く", () => {
    const scale = new Set(namesOf("text"));

    expect(
      TEXT_PAIRS.flatMap((pair) => pair.split("/")).filter(
        (name) => !scale.has(name),
      ),
    ).toEqual([]);
  });
});

describe("1つの文字列の class の数", () => {
  const rule = "project(max-classes-per-string)";

  test("class が9個以上の文字列を、属性・関数の引数・変数の初期値と既定値で止めること", () => {
    const expected: Expected[] = [
      [4, "1つの文字列に class が 9 個あります"],
      [7, "1つの文字列に class が 9 個あります"],
      [15, "1つの文字列に class が 9 個あります"],
      [22, "className の文字列に class が 9 個あります"],
      [26, "1つの文字列に class が 9 個あります"],
      [39, "1つの文字列に class が 9 個あります"],
      [43, "1つの文字列に class が 9 個あります"],
      [47, "1つの文字列に class が 9 個あります"],
      [58, "1つの文字列に class が 9 個あります"],
    ];

    expect(
      diagnosticsOf(
        { file: "invalid/apps/admin/src/ui/primitives/long-classes.tsx", rule },
        expected,
      ),
    ).toEqual(expected);
  });

  test("配列に分けた8個までの文字列と、class でない文字列には診断を出さないこと", () => {
    for (const name of ["split", "default", "spread"]) {
      expect(
        ruleIdsOf(
          lintFixture(`valid/apps/admin/src/ui/primitives/${name}-classes.tsx`),
        ),
      ).toEqual([]);
    }
  });
});
