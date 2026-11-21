import { describe, expect, expectTypeOf, test } from "bun:test";
import { z } from "zod";

import { toContentSchema } from "@analemma/contract";

import { type KindContent, defineKind } from "../define-kind";
import { group, repeat } from "../nested-fields";
import { optional } from "../optional-field";
import { boolean, date, longText, number, text, url } from "../scalar-fields";
import { select } from "../select-field";

const about = defineKind({
  name: "about",
  label: "自己紹介",
  fields: {
    headline: text({ label: "見出し" }),
    bio: optional(longText({ label: "本文" })),
    age: optional(number({ label: "年" })),
    open: boolean({ label: "受付中" }),
    born: optional(date({ label: "生まれた日" })),
    theme: select({
      label: "色",
      options: [
        { value: "light", label: "明るい" },
        { value: "dark", label: "暗い" },
      ],
    }),
    profile: optional(
      group({ label: "経歴", fields: { role: text({ label: "役割" }) } }),
    ),
    links: repeat({
      label: "リンク",
      fields: { name: text({ label: "名前" }), url: url({ label: "URL" }) },
    }),
  },
});

describe("種類の定義", () => {
  test("項目を書いた順のまま、CMS に送る定義にすること", () => {
    expect(about.definition).toEqual({
      name: "about",
      label: "自己紹介",
      fields: [
        { key: "headline", label: "見出し", type: "text", optional: false },
        { key: "bio", label: "本文", type: "longText", optional: true },
        { key: "age", label: "年", type: "number", optional: true },
        { key: "open", label: "受付中", type: "boolean", optional: false },
        { key: "born", label: "生まれた日", type: "date", optional: true },
        {
          key: "theme",
          label: "色",
          type: "select",
          optional: false,
          options: [
            { value: "light", label: "明るい" },
            { value: "dark", label: "暗い" },
          ],
        },
        {
          key: "profile",
          label: "経歴",
          type: "group",
          optional: true,
          fields: [
            { key: "role", label: "役割", type: "text", optional: false },
          ],
        },
        {
          key: "links",
          label: "リンク",
          type: "repeat",
          optional: false,
          fields: [
            { key: "name", label: "名前", type: "text", optional: false },
            { key: "url", label: "URL", type: "url", optional: false },
          ],
        },
      ],
    });
  });

  test("定義から、中身の型を推論すること", () => {
    const expected = z.object({
      headline: z.string(),
      bio: z.string().optional(),
      age: z.number().optional(),
      open: z.boolean(),
      born: z.string().optional(),
      theme: z.enum(["light", "dark"]),
      profile: z.object({ role: z.string() }).optional(),
      links: z.array(z.object({ name: z.string(), url: z.string() })),
    });

    expectTypeOf<KindContent<typeof about>>().toEqualTypeOf<
      z.output<typeof expected>
    >();
  });

  test.each([
    {
      title: "すべての型の値",
      value: {
        headline: "こんにちは",
        bio: "1行目\n2行目",
        age: 30,
        open: true,
        born: "2000-01-01",
        theme: "dark",
        profile: { role: "デザイナー", old: 1 },
        links: [{ name: "サイト", url: "https://example.com" }],
        removed: "古い項目",
      },
    },
    {
      title: "必須の項目が無い値",
      value: { open: true, theme: "dark", links: [] },
    },
    {
      title: "選択肢に無い値",
      value: { headline: "a", open: true, theme: "blue", links: [] },
    },
    {
      title: "改行のあるテキスト",
      value: { headline: "a\nb", open: true, theme: "dark", links: [] },
    },
    {
      title: "http でない URL",
      value: {
        headline: "a",
        open: true,
        theme: "dark",
        links: [{ name: "a", url: "ftp://example.com" }],
      },
    },
    {
      title: "無い日付",
      value: {
        headline: "a",
        open: true,
        theme: "dark",
        born: "2026-02-30",
        links: [],
      },
    },
  ])(
    "$title を、CMS が定義から作るスキーマと同じように扱うこと",
    ({ value }) => {
      const cms = toContentSchema({
        fields: about.definition.fields,
        unknownKeys: "strip",
      }).safeParse(value);
      const site = about.content.safeParse(value);

      const actual: unknown = { success: site.success, data: site.data };

      expect(actual).toEqual({
        success: cms.success,
        data: cms.data,
      });
    },
  );

  test("項目の関数で作っていないスキーマは、項目に使えないこと", () => {
    expect(() =>
      defineKind({
        name: "raw",
        label: "生のスキーマ",
        fields: { title: z.string() },
      }),
    ).toThrow(
      "項目には、@analemma/client の項目の関数で作ったスキーマだけを使える",
    );
    expect(() =>
      defineKind({
        name: "refined",
        label: "絞ったスキーマ",
        fields: { title: text({ label: "見出し" }).min(3) },
      }),
    ).toThrow();
  });

  test("グループや繰り返しに渡した項目を後から書き換えても、CMS に送る定義と中身のスキーマが食い違わないこと", () => {
    const fields: Record<string, ReturnType<typeof text>> = {
      caption: text({ label: "説明" }),
    };
    const kind = defineKind({
      name: "gallery",
      label: "ギャラリー",
      fields: { items: repeat({ label: "画像", fields }) },
    });

    fields["caption"] = text({ label: "説明" }).min(3);

    expect(kind.content.safeParse({ items: [{ caption: "a" }] }).success).toBe(
      true,
    );
  });

  test("symbol の名前の項目は、使えないこと", () => {
    expect(() =>
      defineKind({
        name: "about",
        label: "自己紹介",
        fields: { [Symbol("caption")]: text({ label: "説明" }) },
      }),
    ).toThrow("項目の名前には、symbol でなく文字列を使う");
  });

  test("CMS が断る名前の種類は、定義した時点で失敗すること", () => {
    expect(() =>
      defineKind({
        name: "About",
        label: "自己紹介",
        fields: {},
      }),
    ).toThrow();
    expect(() =>
      defineKind({
        name: "about",
        label: "自己紹介",
        fields: { "1st": text({ label: "見出し" }) },
      }),
    ).toThrow();
  });
});
