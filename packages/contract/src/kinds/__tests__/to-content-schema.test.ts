import { describe, expect, test } from "bun:test";

import { kindDefinition } from "../kind-definition";
import { toContentSchema } from "../to-content-schema";

const { fields } = kindDefinition.parse({
  name: "about",
  label: "自己紹介",
  fields: [
    { key: "headline", label: "見出し", type: "text" },
    { key: "bio", label: "本文", type: "longText", optional: true },
    { key: "age", label: "年", type: "number", optional: true },
    { key: "open", label: "受付中", type: "boolean", optional: true },
    { key: "born", label: "生まれた日", type: "date", optional: true },
    { key: "site", label: "サイト", type: "url", optional: true },
    {
      key: "theme",
      label: "色",
      type: "select",
      optional: true,
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
      fields: [{ key: "role", label: "役割", type: "text" }],
    },
    {
      key: "links",
      label: "リンク",
      type: "repeat",
      optional: true,
      fields: [{ key: "url", label: "URL", type: "url" }],
    },
  ],
});

const keep = toContentSchema({ fields, unknownKeys: "keep" });
const strip = toContentSchema({ fields, unknownKeys: "strip" });

const fullContent = {
  headline: "こんにちは",
  bio: "1行目\n2行目\tタブ",
  age: 30,
  open: false,
  born: "1996-02-29",
  site: "https://example.com/about",
  theme: "dark",
  profile: { role: "デザイナー" },
  links: [{ url: "http://example.org" }],
};

const issuesOf = (value: unknown): string[] =>
  keep.safeParse(value).error?.issues.map(({ path }) => path.join(".")) ?? [];

describe("中身の検査", () => {
  test("どの型の項目も、定義に合う値を受け付けること", () => {
    expect(keep.parse(fullContent)).toEqual(fullContent);
  });

  test("必須の項目が無いと断り、任意の項目は省けること", () => {
    expect(issuesOf({})).toEqual(["headline"]);
    expect(keep.parse({ headline: "a" })).toEqual({ headline: "a" });
  });

  test.each([
    { title: "空のテキスト", value: { headline: "" }, path: "headline" },
    {
      title: "改行のあるテキスト",
      value: { headline: "a\nb" },
      path: "headline",
    },
    {
      title: "NUL のある長いテキスト",
      value: { headline: "a", bio: "a\u0000b" },
      path: "bio",
    },
    {
      title: "対になっていないサロゲート",
      value: { headline: "\uD800" },
      path: "headline",
    },
    { title: "数でない数値", value: { headline: "a", age: "30" }, path: "age" },
    {
      title: "無限大の数値",
      value: { headline: "a", age: Infinity },
      path: "age",
    },
    {
      title: "無い日付",
      value: { headline: "a", born: "2026-02-29" },
      path: "born",
    },
    {
      title: "時刻の付いた日付",
      value: { headline: "a", born: "2026-01-01T00:00:00Z" },
      path: "born",
    },
    {
      title: "http でない URL",
      value: { headline: "a", site: "ftp://example.com/file" },
      path: "site",
    },
    {
      title: "対になっていないサロゲートのある URL",
      value: { headline: "a", site: "https://example.com/\uD800" },
      path: "site",
    },
    {
      title: "改行のある URL",
      value: { headline: "a", site: "https://exa\nmple.com" },
      path: "site",
    },
    {
      title: "選択肢に無い値",
      value: { headline: "a", theme: "blue" },
      path: "theme",
    },
    {
      title: "グループの中の誤り",
      value: { headline: "a", profile: {} },
      path: "profile.role",
    },
    {
      title: "繰り返しの中の誤り",
      value: { headline: "a", links: [{ url: 1 }] },
      path: "links.0.url",
    },
  ])("$title は、その項目の誤りとして断ること", ({ path, value }) => {
    expect(issuesOf(value)).toEqual([path]);
  });

  test("定義に無いキーは、keep では入れ子の中でも残し、strip では取り除くこと", () => {
    const content = {
      headline: "a",
      removed: "古い項目",
      profile: { role: "b", old: 1 },
      links: [{ url: "https://example.com", old: true }],
    };

    expect(keep.parse(content)).toEqual(content);
    expect(strip.parse(content)).toEqual({
      headline: "a",
      profile: { role: "b" },
      links: [{ url: "https://example.com" }],
    });
  });
});

describe("項目の名前", () => {
  test.each(["constructor", "toString", "hasOwnProperty", "valueOf"])(
    "%s のような、オブジェクトが元から持つ名前は使えないこと",
    (key) => {
      expect(
        kindDefinition.safeParse({
          name: "about",
          label: "自己紹介",
          fields: [{ key, label: "名前", type: "text", optional: true }],
        }).success,
      ).toBe(false);
    },
  );
});
