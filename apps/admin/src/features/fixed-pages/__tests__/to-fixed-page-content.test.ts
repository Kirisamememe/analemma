import { describe, expect, test } from "bun:test";

import {
  type FixedPageContent,
  fieldDefinitions,
  fixedPageContent,
  kindDefinition,
  toContentSchema,
} from "@analemma/contract";

import { createContentForm, isFormGroup } from "../content-form";
import { toFixedPageContent } from "../to-fixed-page-content";

const title = { key: "title", type: "text", label: "見出し" };
const flag = { key: "flag", type: "boolean", label: "表示" };
const group = { key: "details", type: "group", label: "詳細", fields: [title] };
const repeat = { key: "rows", type: "repeat", label: "行", fields: [title] };

const isContent = (value: unknown): value is FixedPageContent =>
  fixedPageContent.safeParse(value).success;

describe("toFixedPageContent", () => {
  test("空にした任意の項目をキーごと省く", () => {
    const fields = fieldDefinitions.parse([
      { ...title, optional: true },
      { key: "body", type: "longText", label: "本文", optional: true },
      { ...flag, optional: true },
      { key: "count", type: "number", label: "件数", optional: true },
      { key: "day", type: "date", label: "日付", optional: true },
      { key: "link", type: "url", label: "URL", optional: true },
      {
        key: "color",
        type: "select",
        label: "色",
        options: [{ value: "red", label: "赤" }],
        optional: true,
      },
      { ...group, optional: true },
      { ...repeat, optional: true },
    ]);
    const saved = {
      title: "   ",
      body: "\n\t",
      count: 0,
      flag: false,
      day: "2024-02-29",
      link: " https://example.com ",
      color: "red",
      details: { title: "旧" },
      rows: [{ title: "行" }],
    };
    const form = createContentForm(fields, saved);
    expect(toFixedPageContent(fields, form)).toEqual(saved);

    const cleared = {
      ...form,
      values: {
        ...form.values,
        title: "",
        body: "",
        count: null,
        flag: null,
        day: null,
        link: "",
        color: null,
        details: { values: { title: "" }, unknownKeys: {} },
        rows: [],
      },
    };
    const content = toFixedPageContent(fields, cleared);
    expect(Object.keys(content)).toEqual([]);
    expect(
      toContentSchema({ fields, unknownKeys: "keep" }).safeParse(content)
        .success,
    ).toBe(true);
  });

  test("必須の group と repeat は空でも送り、未入力の必須の項目は server の検査が issue にする", () => {
    const fields = fieldDefinitions.parse([title, group, repeat]);
    const content = toFixedPageContent(fields, createContentForm(fields));
    expect(content).toEqual({ details: {}, rows: [] });

    const result = toContentSchema({ fields, unknownKeys: "keep" }).safeParse(
      content,
    );
    expect(result.error?.issues.map(({ path }) => path)).toEqual([
      ["title"],
      ["details", "title"],
    ]);
  });

  test("任意の group は必須の boolean の初期値だけなら省き、true や任意の boolean の false を選ぶと送る", () => {
    const fields = fieldDefinitions.parse([
      {
        ...group,
        optional: true,
        fields: [title, { ...flag, key: "pinned", optional: true }, flag],
      },
    ]);
    const form = createContentForm(fields);
    const content = toFixedPageContent(fields, form);
    expect(content).toStrictEqual({});
    expect(
      toContentSchema({ fields, unknownKeys: "keep" }).safeParse(content)
        .success,
    ).toBe(true);

    const details = form.values["details"];

    if (!isFormGroup(details)) throw new Error("details の group が無い");

    const select = (key: string, value: boolean) =>
      toFixedPageContent(fields, {
        ...form,
        values: {
          details: { ...details, values: { ...details.values, [key]: value } },
        },
      });
    expect(select("flag", true)).toEqual({ details: { flag: true } });
    expect(select("pinned", false)).toEqual({
      details: { flag: false, pinned: false },
    });
  });

  test("必須の group には、必須の boolean の初期値 false を入れて送る", () => {
    const fields = fieldDefinitions.parse([{ ...group, fields: [flag] }]);
    expect(toFixedPageContent(fields, createContentForm(fields))).toEqual({
      details: { flag: false },
    });
  });

  test("任意の group の中に空の必須の group・repeat があるだけなら省く", () => {
    const fields = fieldDefinitions.parse([
      {
        ...group,
        optional: true,
        fields: [group, repeat, { ...flag, optional: true }],
      },
    ]);
    const send = (content: FixedPageContent) =>
      toFixedPageContent(fields, createContentForm(fields, content));
    expect(send({ details: { details: {}, rows: [] } })).toEqual({});
    expect(send({ details: { flag: false } })).toEqual({
      details: { flag: false, details: {}, rows: [] },
    });
    expect(send({ details: { rows: [{}] } })).toEqual({
      details: { details: {}, rows: [{}] },
    });
    expect(send({ details: { old: null } })).toEqual({
      details: { old: null, details: {}, rows: [] },
    });
  });

  test("定義に無いキーと __proto__ を入れ子の各段で保ち、prototype を書き換えない", () => {
    const fields = fieldDefinitions.parse([
      { ...group, optional: true },
      { ...repeat, fields: [group] },
    ]);
    const saved: unknown = JSON.parse(
      '{"__proto__":{"old":1},"details":{"__proto__":{"old":2}},"rows":[{"__proto__":{"old":3},"details":{"__proto__":{"old":4}}}]}',
    );

    if (!isContent(saved)) throw new Error("固定ページの中身を読み取れない");

    const form = createContentForm(fields, saved);
    const content = toFixedPageContent(fields, form);
    expect(content).toStrictEqual(saved);
    expect(Object.hasOwn(form.unknownKeys, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(form.unknownKeys)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(content)).toBe(Object.prototype);
  });

  test("repeat の並べ替えと削除でも、ID と定義に無いキーは各要素に残る", () => {
    const fields = fieldDefinitions.parse([repeat]);
    const first = { title: "同じ", old: 1 };
    const last = { title: "同じ", old: 3 };
    const rows = [first, { title: "同じ", old: 2 }, last];
    const form = createContentForm(fields, { rows });
    const items = form.values["rows"];

    if (!Array.isArray(items)) throw new Error("repeat の値が無い");

    const ids = items.map(({ id }) => id);
    expect(new Set(ids).size).toBe(3);

    const reordered = items.toReversed().filter(({ id }) => id !== ids[1]);
    expect(
      toFixedPageContent(fields, { ...form, values: { rows: reordered } }),
    ).toEqual({ rows: [last, first] });
    expect(reordered[0]?.id).toBe(ids[2]);
    expect(reordered[1]?.id).toBe(ids[0]);
  });

  test("5段の種類の定義で、送った中身からフォームを作り直せる", () => {
    const { fields } = kindDefinition.parse({
      name: "article",
      label: "記事",
      fields: [
        {
          ...repeat,
          fields: [{ ...group, fields: [{ ...repeat, fields: [group] }] }],
        },
      ],
    });
    const saved = {
      rows: [
        {
          old: { heading: true },
          details: { rows: [{ details: { title: "本文", old: [1, false] } }] },
        },
      ],
    };
    const first = toFixedPageContent(fields, createContentForm(fields, saved));
    expect(first).toStrictEqual(saved);
    expect(
      toContentSchema({ fields, unknownKeys: "keep" }).parse(first),
    ).toEqual(saved);
    expect(
      toFixedPageContent(fields, createContentForm(fields, first)),
    ).toStrictEqual(saved);
  });
});
