import { describe, expect, test } from "bun:test";

import type { FieldDefinitionInput } from "../field-definition";
import { kindDefinition } from "../kind-definition";

const title: FieldDefinitionInput = {
  key: "title",
  label: "見出し",
  type: "text",
};

const nest = (...types: ("group" | "repeat")[]): FieldDefinitionInput[] =>
  types.reduceRight<FieldDefinitionInput[]>(
    (fields, type) => [{ key: type, label: type, type, fields }],
    [title],
  );

const parse = (fields: FieldDefinitionInput[]) =>
  kindDefinition.safeParse({ name: "about", label: "自己紹介", fields });

describe("項目の入れ子", () => {
  test("種類の直下の項目を1段と数え、グループと繰り返しを2段まで重ねた3段は受け付けること", () => {
    expect(parse(nest("group", "repeat")).success).toBe(true);
    expect(parse(nest("repeat", "group")).success).toBe(true);
  });

  test("一番深い枝が4段になる定義は、ほかの枝が浅くても断ること", () => {
    expect(
      parse([title, ...nest("group", "repeat", "group")]).error?.issues,
    ).toMatchObject([
      {
        path: ["fields"],
        message: "項目の入れ子は、種類の直下の項目を含めて 3 段まで",
      },
    ]);
  });
});

describe("真偽値の項目", () => {
  test("既定値を省くと false にし、書けばその値にすること", () => {
    expect(
      parse([
        { key: "flag", label: "表示", type: "boolean" },
        { key: "hidden", label: "隠す", type: "boolean", default: true },
      ]).data?.fields,
    ).toEqual([
      { key: "flag", label: "表示", type: "boolean", default: false },
      { key: "hidden", label: "隠す", type: "boolean", default: true },
    ]);
  });

  test.each([true, false])(
    "optional を %p にすると、select を使うよう知らせて断ること",
    (optional) => {
      const fields = [
        { key: "flag", label: "表示", type: "boolean", optional },
      ];

      expect(
        kindDefinition.safeParse({ name: "about", label: "自己紹介", fields })
          .error?.issues,
      ).toMatchObject([
        {
          path: ["fields", 0, "optional"],
          message:
            "真偽値の項目は省けない。3つ目の状態が要るなら select を使う",
        },
      ]);
    },
  );
});
