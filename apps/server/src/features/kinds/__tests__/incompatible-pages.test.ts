import { describe, expect, test } from "bun:test";

import type {
  FieldDefinitionInput,
  FixedPageContent,
  KindDefinitionInput,
} from "@analemma/contract";

import {
  SUCCEEDED,
  catchErrorCode,
} from "../../../test-client/catch-error-code";
import {
  type TestClient,
  createTestClient,
} from "../../../test-client/create-test-client";
import { prepareTestKinds } from "../../../test-client/prepare-test-kinds";

const headline: FieldDefinitionInput = {
  key: "headline",
  label: "見出し",
  type: "text",
};

const profile: KindDefinitionInput = {
  name: "profile",
  label: "自己紹介",
  fields: [
    headline,
    { key: "age", label: "年", type: "number", optional: true },
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
  ],
};

const withFields = (
  fields: KindDefinitionInput["fields"],
): KindDefinitionInput => ({ ...profile, fields });

/** 種類の定義を送れる、ページを1つ持つテストの server。 */
type Prepared = {
  /** テストの server。 */
  readonly server: TestClient;
  /** 定義を送るためのトークン。 */
  readonly token: string;
  /** 作ったページの ID。 */
  readonly pageId: string;
};

const preparePage = async (
  server: TestClient,
  content: FixedPageContent,
): Promise<Prepared> => {
  const token = await prepareTestKinds(server, [profile]);
  const page = await server.client.admin.fixedPages.create({
    kind: "profile",
    slug: "about",
    title: "自己紹介",
    content,
  });

  return { server, token, pageId: page.id };
};

const push = async (
  { server, token }: Prepared,
  kinds: KindDefinitionInput[],
): Promise<string> =>
  catchErrorCode(server.internal(token).deploy.kinds.push({ kinds }));

describe("既存の固定ページに合わない定義", () => {
  test("データの入った項目の型を変えると、合わないページの一覧を添えて断り、何も変えないこと", async () => {
    await using server = await createTestClient();
    const prepared = await preparePage(server, { headline: "やあ", age: 30 });
    const error = await server
      .internal(prepared.token)
      .deploy.kinds.push({
        kinds: [
          withFields([
            headline,
            { key: "age", label: "年", type: "text", optional: true },
          ]),
          { name: "colophon", label: "奥付", fields: [] },
        ],
      })
      .catch((error_: unknown) => error_);

    expect(error).toMatchObject({
      code: "INCOMPATIBLE_PAGES",
      data: {
        pages: [
          {
            kind: "profile",
            id: prepared.pageId,
            slug: "about",
            title: "自己紹介",
            issues: [{ path: ["age"], code: "invalid_type" }],
          },
        ],
      },
    });
    expect(
      (await server.client.admin.kinds.list()).kinds.map(({ name }) => name),
    ).toEqual(["profile"]);
    expect(
      (await server.client.admin.kinds.get({ name: "profile" })).fields,
    ).toHaveLength(3);
    expect(server.logs.at(-1)).toMatchObject({
      level: "warn",
      message: "既存の固定ページに合わない種類の定義を断った",
      details: { pages: [{ id: prepared.pageId, kind: "profile" }] },
    });
  });

  test("データの入っていない項目なら、型を変えても受け付けること", async () => {
    await using server = await createTestClient();
    const prepared = await preparePage(server, { headline: "やあ" });

    expect(
      await push(prepared, [
        withFields([
          headline,
          { key: "age", label: "年", type: "text", optional: true },
        ]),
      ]),
    ).toBe(SUCCEEDED);
  });

  test("ページがある種類に必須の項目を足すと断り、任意の項目なら受け付けること", async () => {
    await using server = await createTestClient();
    const prepared = await preparePage(server, { headline: "やあ" });

    expect(
      await push(prepared, [
        withFields([
          ...profile.fields,
          { key: "bio", label: "本文", type: "longText" },
        ]),
      ]),
    ).toBe("INCOMPATIBLE_PAGES");
    expect(
      await push(prepared, [
        withFields([
          ...profile.fields,
          { key: "bio", label: "本文", type: "longText", optional: true },
        ]),
      ]),
    ).toBe(SUCCEEDED);
  });

  test("使われている選択肢を消すと断ること", async () => {
    await using server = await createTestClient();
    const prepared = await preparePage(server, {
      headline: "やあ",
      theme: "dark",
    });

    expect(
      await push(prepared, [
        withFields([
          headline,
          {
            key: "theme",
            label: "色",
            type: "select",
            optional: true,
            options: [{ value: "light", label: "明るい" }],
          },
        ]),
      ]),
    ).toBe("INCOMPATIBLE_PAGES");
  });

  test("項目を消しても断らず、データは残るので、元の定義に戻せること", async () => {
    await using server = await createTestClient();
    const prepared = await preparePage(server, {
      headline: "やあ",
      age: 30,
      theme: "dark",
    });

    expect(await push(prepared, [withFields([headline])])).toBe(SUCCEEDED);

    const page = await server.client.admin.fixedPages.get({
      id: prepared.pageId,
    });

    await server.client.admin.fixedPages.update({
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
    });

    expect(await push(prepared, [profile])).toBe(SUCCEEDED);
    expect(
      (await server.client.admin.fixedPages.get({ id: prepared.pageId }))
        .content,
    ).toEqual({ headline: "やあ", age: 30, theme: "dark" });
  });
});
