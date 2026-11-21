import { describe, expect, test } from "bun:test";

import type { FixedPageContent, KindDefinitionInput } from "@analemma/contract";

import {
  SUCCEEDED,
  catchErrorCode,
} from "../../../test-client/catch-error-code";
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
    { key: "born", label: "生まれた日", type: "date", optional: true },
    {
      key: "links",
      label: "リンク",
      type: "repeat",
      fields: [{ key: "url", label: "URL", type: "url" }],
    },
  ],
};

const content = { headline: "こんにちは", links: [] };

/** 書き換えで、既定から変える値。 */
type PageChange = {
  /** 送る slug。 */
  readonly slug?: string;
  /** 送る中身。 */
  readonly content?: FixedPageContent;
};

describe("固定ページを作る", () => {
  test("種類を選んで作ると、公開していないページになり、並びの最後に付くこと", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const first = await admin.create({
      kind: "profile",
      slug: "about",
      title: " 自己紹介 ",
      content,
    });
    const second = await admin.create({
      kind: "profile",
      slug: "now",
      title: "いま",
      content: { ...content, born: "2000-01-01" },
    });

    expect(first).toEqual({
      id: first.id,
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      published: false,
      publishedAt: null,
      position: 0,
      createdAt: TEST_NOW.toISOString(),
      updatedAt: TEST_NOW.toISOString(),
      content,
    });
    expect(second.position).toBe(1);
    expect(await admin.get({ id: second.id })).toEqual(second);
    expect((await admin.list()).pages.map(({ slug }) => slug)).toEqual([
      "about",
      "now",
    ]);
    expect(
      await catchErrorCode(
        server
          .internal()
          .public.fixedPages.get({ kind: "profile", slug: "about" }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("中身が種類の定義に合わなければ、合わない場所を添えて INVALID_CONTENT で断ること", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const error = await server.client.admin.fixedPages
      .create({
        kind: "profile",
        slug: "about",
        title: "自己紹介",
        content: { headline: "", links: [{ url: "ftp://example.com" }] },
      })
      .catch((error_: unknown) => error_);

    expect(error).toMatchObject({
      code: "INVALID_CONTENT",
      data: {
        issues: [
          { path: ["headline"], code: "too_small" },
          { path: ["links", 0, "url"], code: "invalid_format" },
        ],
      },
    });
    expect((await server.client.admin.fixedPages.list()).pages).toEqual([]);
  });

  test("無い種類は UNKNOWN_KIND、使われている slug は SLUG_TAKEN で断ること", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const create = async (kind: string, slug: string): Promise<string> =>
      catchErrorCode(
        server.client.admin.fixedPages.create({
          kind,
          slug,
          title: "タイトル",
          content,
        }),
      );

    expect(await create("nothing", "about")).toBe("UNKNOWN_KIND");
    expect(await create("profile", "about")).toBe(SUCCEEDED);
    expect(await create("profile", "about")).toBe("SLUG_TAKEN");
    expect(await create("profile", "About")).toBe("BAD_REQUEST");
  });
});

describe("固定ページを書き換える", () => {
  test("タイトル・slug・中身を書き換え、更新した日時を進めること", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const page = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content,
    });

    now = new Date(TEST_NOW.getTime() + 60_000);

    const updated = await admin.update({
      id: page.id,
      slug: "about-me",
      title: "私について",
      content: { headline: "やあ", links: [{ url: "https://example.com" }] },
    });

    expect(updated).toEqual({
      ...page,
      slug: "about-me",
      title: "私について",
      updatedAt: now.toISOString(),
      content: { headline: "やあ", links: [{ url: "https://example.com" }] },
    });
  });

  test("無いページは NOT_FOUND、ほかのページの slug は SLUG_TAKEN、合わない中身は INVALID_CONTENT にすること", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const about = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content,
    });

    await admin.create({
      kind: "profile",
      slug: "now",
      title: "いま",
      content,
    });

    const update = async (id: string, change: PageChange): Promise<string> =>
      catchErrorCode(
        admin.update({
          id,
          slug: change.slug ?? "about",
          title: "自己紹介",
          content: change.content ?? content,
        }),
      );

    expect(await update("0190b5e0-0000-7000-8000-000000000000", {})).toBe(
      "NOT_FOUND",
    );
    expect(await update(about.id, { slug: "now" })).toBe("SLUG_TAKEN");
    expect(await update(about.id, { content: { links: [] } })).toBe(
      "INVALID_CONTENT",
    );
    expect(await update(about.id, {})).toBe(SUCCEEDED);
  });
});

describe("固定ページを消す", () => {
  test("消したページは一覧から消え、もう一度消すと NOT_FOUND になること", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const page = await admin.create({
      kind: "profile",
      slug: "about",
      title: "自己紹介",
      content,
    });

    await admin.delete({ id: page.id });

    expect((await admin.list()).pages).toEqual([]);
    expect(await catchErrorCode(admin.delete({ id: page.id }))).toBe(
      "NOT_FOUND",
    );
  });
});

describe("固定ページの並び順", () => {
  test("すべてのページを、渡した順に並べ直すこと", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const ids = [];

    for (const slug of ["a", "b", "c"]) {
      ids.push(
        (await admin.create({ kind: "profile", slug, title: slug, content }))
          .id,
      );
    }

    const [a = "", b = "", c = ""] = ids;
    const reordered = await admin.reorder({ ids: [c, a, b] });

    expect(
      reordered.pages.map(({ position, slug }) => ({ slug, position })),
    ).toEqual([
      { slug: "c", position: 0 },
      { slug: "a", position: 1 },
      { slug: "b", position: 2 },
    ]);
    expect((await admin.list()).pages.map(({ slug }) => slug)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  test("足りない・知らない ID を含む並びは ORDER_MISMATCH、重なる ID は入力の誤りにすること", async () => {
    await using server = await createTestClient();

    await prepareTestKinds(server, [profile]);

    const admin = server.client.admin.fixedPages;
    const a = await admin.create({
      kind: "profile",
      slug: "a",
      title: "a",
      content,
    });
    const b = await admin.create({
      kind: "profile",
      slug: "b",
      title: "b",
      content,
    });
    const unknown = "0190b5e0-0000-7000-8000-000000000000";

    expect(await catchErrorCode(admin.reorder({ ids: [a.id] }))).toBe(
      "ORDER_MISMATCH",
    );
    expect(
      await catchErrorCode(admin.reorder({ ids: [a.id, b.id, unknown] })),
    ).toBe("ORDER_MISMATCH");
    expect(await catchErrorCode(admin.reorder({ ids: [a.id, unknown] }))).toBe(
      "ORDER_MISMATCH",
    );
    expect(await catchErrorCode(admin.reorder({ ids: [a.id, a.id] }))).toBe(
      "BAD_REQUEST",
    );
    expect((await admin.list()).pages.map(({ slug }) => slug)).toEqual([
      "a",
      "b",
    ]);
  });
});
