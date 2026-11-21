import { describe, expect, test } from "bun:test";

import type { KindDefinitionInput } from "@analemma/contract";

import { catchErrorCode } from "../../../test-client/catch-error-code";
import {
  TEST_NOW,
  createTestClient,
} from "../../../test-client/create-test-client";
import { issueTestDeployToken } from "../../../test-client/prepare-test-kinds";
import { signInAsAdmin } from "../../../test-client/sign-in-as-admin";

const about: KindDefinitionInput = {
  name: "about",
  label: "自己紹介",
  fields: [
    { key: "headline", label: "見出し", type: "text" },
    { key: "bio", label: "本文", type: "longText" },
    { key: "born", label: "生まれた日", type: "date", optional: true },
    {
      key: "links",
      label: "リンク",
      type: "repeat",
      fields: [
        { key: "name", label: "名前", type: "text" },
        { key: "url", label: "URL", type: "url" },
      ],
    },
    {
      key: "theme",
      label: "色",
      type: "select",
      options: [
        { value: "light", label: "明るい" },
        { value: "dark", label: "暗い" },
      ],
    },
  ],
};

/** 断るはずの定義と、その説明。 */
type InvalidCase = {
  /** テストの名前に出す説明。 */
  readonly title: string;
  /** 送る種類の定義。 */
  readonly kinds: KindDefinitionInput[];
};

const colophon: KindDefinitionInput = {
  name: "colophon",
  label: "このサイトについて",
  fields: [{ key: "body", label: "本文", type: "longText" }],
};

describe("種類の定義を送る", () => {
  test("まだ無い種類を作り、項目を送った順のまま、管理画面に返すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const token = await issueTestDeployToken(server);

    expect(
      await server.internal(token).deploy.kinds.push({ kinds: [about] }),
    ).toEqual({ kinds: [{ name: "about", change: "created" }] });
    expect(await server.client.admin.kinds.get({ name: "about" })).toEqual({
      name: "about",
      label: "自己紹介",
      createdAt: TEST_NOW.toISOString(),
      updatedAt: TEST_NOW.toISOString(),
      fields: [
        { key: "headline", label: "見出し", type: "text", optional: false },
        { key: "bio", label: "本文", type: "longText", optional: false },
        { key: "born", label: "生まれた日", type: "date", optional: true },
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
      ],
    });
  });

  test("同じ定義を何度送っても、何も変えないこと", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    await signInAsAdmin(server);

    const deploy = server.internal(await issueTestDeployToken(server)).deploy;

    await deploy.kinds.push({ kinds: [about, colophon] });
    now = new Date(TEST_NOW.getTime() + 60_000);

    expect(await deploy.kinds.push({ kinds: [colophon, about] })).toEqual({
      kinds: [
        { name: "colophon", change: "unchanged" },
        { name: "about", change: "unchanged" },
      ],
    });
    expect(await server.client.admin.kinds.list()).toEqual({
      kinds: [
        {
          name: "about",
          label: "自己紹介",
          createdAt: TEST_NOW.toISOString(),
          updatedAt: TEST_NOW.toISOString(),
        },
        {
          name: "colophon",
          label: "このサイトについて",
          createdAt: TEST_NOW.toISOString(),
          updatedAt: TEST_NOW.toISOString(),
        },
      ],
    });
  });

  test("定義が変わった種類だけを書き換え、送らなかった種類は残すこと", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    await signInAsAdmin(server);

    const deploy = server.internal(await issueTestDeployToken(server)).deploy;

    await deploy.kinds.push({ kinds: [about, colophon] });
    now = new Date(TEST_NOW.getTime() + 60_000);

    expect(
      await deploy.kinds.push({
        kinds: [{ ...about, fields: about.fields.slice(0, 2) }],
      }),
    ).toEqual({ kinds: [{ name: "about", change: "updated" }] });
    expect(
      await deploy.kinds.push({ kinds: [{ ...colophon, label: "奥付" }] }),
    ).toEqual({ kinds: [{ name: "colophon", change: "updated" }] });

    const kinds = await server.client.admin.kinds.list();

    expect(
      kinds.kinds.map(({ label, name, updatedAt }) => ({
        name,
        label,
        updatedAt,
      })),
    ).toEqual([
      { name: "about", label: "自己紹介", updatedAt: now.toISOString() },
      { name: "colophon", label: "奥付", updatedAt: now.toISOString() },
    ]);
    expect(
      (await server.client.admin.kinds.get({ name: "about" })).fields.map(
        ({ key }) => key,
      ),
    ).toEqual(["headline", "bio"]);
  });

  test("受け取った定義と、送ったトークンを、ログに残すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const token = await issueTestDeployToken(server);

    await server.internal(token).deploy.kinds.push({ kinds: [colophon] });

    expect(server.logs.at(-1)).toMatchObject({
      level: "info",
      message: "種類の定義を受け取った",
      details: {
        deployTokenId: token.split(".")[0],
        kinds: [{ name: "colophon", change: "created" }],
      },
    });
  });

  test.each([
    {
      title: "名前が kebab-case でない",
      kinds: [{ ...colophon, name: "Colophon" }],
    },
    { title: "種類の名前が重なる", kinds: [colophon, colophon] },
    {
      title: "項目の名前が重なる",
      kinds: [
        {
          ...colophon,
          fields: [
            { key: "body", label: "本文", type: "text" },
            { key: "body", label: "本文", type: "longText" },
          ],
        },
      ],
    },
    {
      title: "項目の名前が英字で始まらない",
      kinds: [
        {
          ...colophon,
          fields: [{ key: "_body", label: "本文", type: "text" }],
        },
      ],
    },
    {
      title: "グループに項目が無い",
      kinds: [
        {
          ...colophon,
          fields: [{ key: "meta", label: "情報", type: "group", fields: [] }],
        },
      ],
    },
    {
      title: "選択肢の値が重なる",
      kinds: [
        {
          ...colophon,
          fields: [
            {
              key: "theme",
              label: "色",
              type: "select",
              options: [
                { value: "a", label: "A" },
                { value: "a", label: "B" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "項目が6段に入れ子になる",
      kinds: [
        {
          ...colophon,
          fields: [
            {
              key: "a",
              label: "1",
              type: "group",
              fields: [
                {
                  key: "b",
                  label: "2",
                  type: "repeat",
                  fields: [
                    {
                      key: "c",
                      label: "3",
                      type: "group",
                      fields: [
                        {
                          key: "d",
                          label: "4",
                          type: "group",
                          fields: [
                            {
                              key: "e",
                              label: "5",
                              type: "group",
                              fields: [{ key: "f", label: "6", type: "text" }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ] satisfies InvalidCase[])(
    "$title 定義は、入力の誤りとして断ること",
    async ({ kinds }) => {
      await using server = await createTestClient();

      await signInAsAdmin(server);

      const deploy = server.internal(await issueTestDeployToken(server)).deploy;

      expect(await catchErrorCode(deploy.kinds.push({ kinds }))).toBe(
        "BAD_REQUEST",
      );
      expect(await server.client.admin.kinds.list()).toEqual({ kinds: [] });
    },
  );
});

describe("種類の定義を読む", () => {
  test("無い種類は NOT_FOUND にすること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    expect(
      await catchErrorCode(server.client.admin.kinds.get({ name: "nothing" })),
    ).toBe("NOT_FOUND");
  });
});
