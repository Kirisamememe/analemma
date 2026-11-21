import { describe, expect, test } from "bun:test";

import type { KindDefinitionInput } from "@analemma/contract";

import { catchErrorCode } from "../../../test-client/catch-error-code";
import {
  TEST_NOW,
  createTestClient,
} from "../../../test-client/create-test-client";
import { prepareTestKinds } from "../../../test-client/prepare-test-kinds";

const profile: KindDefinitionInput = {
  name: "profile",
  label: "自己紹介",
  fields: [
    { key: "headline", label: "見出し", type: "text" },
    { key: "note", label: "メモ", type: "text", optional: true },
  ],
};

const colophon: KindDefinitionInput = {
  name: "colophon",
  label: "このサイトについて",
  fields: [{ key: "body", label: "本文", type: "longText" }],
};

describe("固定ページの公開", () => {
  test("公開すると公開 API から読め、非公開に戻すと無いものになること", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const page = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content: { headline: "こんにちは" },
    });
    const get = async (): Promise<string> =>
      catchErrorCode(
        server
          .internal()
          .public.fixedPages.get({ kind: "profile", slug: "about" }),
      );

    now = new Date(TEST_NOW.getTime() + 60_000);

    expect(await admin.publish({ id: page.id })).toMatchObject({
      published: true,
      publishedAt: now.toISOString(),
    });
    expect(
      await server
        .internal()
        .public.fixedPages.get({ kind: "profile", slug: "about" }),
    ).toEqual({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      publishedAt: now.toISOString(),
      updatedAt: TEST_NOW.toISOString(),
      content: { headline: "こんにちは" },
    });

    const publishedAt = now;

    now = new Date(TEST_NOW.getTime() + 120_000);

    expect((await admin.publish({ id: page.id })).publishedAt).toBe(
      publishedAt.toISOString(),
    );
    expect(await admin.unpublish({ id: page.id })).toMatchObject({
      published: false,
      publishedAt: null,
    });
    expect(await get()).toBe("NOT_FOUND");
    expect(
      await catchErrorCode(
        admin.publish({ id: "0190b5e0-0000-7000-8000-000000000000" }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("種類が違えば、公開していても無いものとして返すこと", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile, colophon]);

    const admin = server.client.admin.fixedPages;
    const page = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content: { headline: "こんにちは" },
    });

    await admin.publish({ id: page.id });

    expect(
      await catchErrorCode(
        server
          .internal()
          .public.fixedPages.get({ kind: "colophon", slug: "about" }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("一覧は、公開しているページだけを並び順に返し、種類で絞れること", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile, colophon]);

    const admin = server.client.admin.fixedPages;
    const about = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content: { headline: "こんにちは" },
    });
    const draft = await admin.create({
      kind: "profile",
      slug: "draft",
      title: "下書き",
      content: { headline: "まだ" },
    });
    const site = await admin.create({
      kind: "colophon",
      slug: "colophon",
      title: "このサイトについて",
      content: { body: "Bun で動く。" },
    });

    await admin.publish({ id: about.id });
    await admin.publish({ id: site.id });
    await admin.reorder({ ids: [site.id, draft.id, about.id] });

    const list = server.internal().public.fixedPages.list;

    expect((await list({})).pages.map(({ slug }) => slug)).toEqual([
      "colophon",
      "about",
    ]);
    expect(await list({ kind: "profile" })).toEqual({
      pages: [
        {
          kind: "profile",
          slug: "about",
          title: "自己紹介",
          publishedAt: TEST_NOW.toISOString(),
          updatedAt: TEST_NOW.toISOString(),
        },
      ],
    });
  });

  test("公開 API の中身には、今の定義に無い項目を含めないこと", async () => {
    await using server = await createTestClient();
    const token = await prepareTestKinds(server, [profile]);
    const admin = server.client.admin.fixedPages;
    const page = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content: { headline: "こんにちは", note: "古いメモ" },
    });

    await admin.publish({ id: page.id });
    await server.internal(token).deploy.kinds.push({
      kinds: [{ ...profile, fields: profile.fields.slice(0, 1) }],
    });

    expect(
      (
        await server
          .internal()
          .public.fixedPages.get({ kind: "profile", slug: "about" })
      ).content,
    ).toEqual({ headline: "こんにちは" });
    expect((await admin.get({ id: page.id })).content).toEqual({
      headline: "こんにちは",
      note: "古いメモ",
    });
  });
});
