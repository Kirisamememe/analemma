import { safe } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createFakeApi } from "@/testing/create-fake-api";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";

const ABOUT_ID = "019a0000-0000-7000-8000-000000000001";
const COLOPHON_ID = "019a0000-0000-7000-8000-000000000002";
const MISSING_ID = "019a0000-0000-7000-8000-0000000000ff";

const setUp = () => {
  const server = createFixedPageRoutes({
    kinds: [
      {
        name: "page",
        label: "基本のページ",
        fields: [
          { key: "body", label: "本文", type: "longText" },
          { key: "note", label: "補足", type: "text", optional: true },
        ],
      },
    ],
    pages: [
      {
        kind: "page",
        slug: "about",
        title: "About",
        published: true,
        content: { body: "自己紹介" },
      },
      { kind: "page", slug: "colophon", title: "Colophon" },
    ],
  });

  return { server, api: createFakeApi(server.routes).api };
};

const titles = async (api: ReturnType<typeof setUp>["api"]) =>
  (await api.admin.fixedPages.list()).pages.map(({ title }) => title);

describe("createFixedPageRoutes", () => {
  test("一覧は並び順で返し、種類のラベルと定義も返す", async () => {
    const { api } = setUp();

    expect(await titles(api)).toEqual(["About", "Colophon"]);
    expect((await api.admin.kinds.list()).kinds).toMatchObject([
      { name: "page", label: "基本のページ" },
    ]);
    expect(await api.admin.kinds.get({ name: "page" })).toMatchObject({
      fields: [
        { key: "body", optional: false },
        { key: "note", optional: true },
      ],
    });
  });

  test("作ったページは非公開で最後に付き、取得で中身を返す", async () => {
    const { api } = setUp();
    const created = await api.admin.fixedPages.create({
      kind: "page",
      slug: "contact",
      title: "Contact",
      content: { body: "連絡先", extra: [1, 2] },
    });

    expect(created).toMatchObject({ published: false, publishedAt: null });
    expect(await titles(api)).toEqual(["About", "Colophon", "Contact"]);
    expect(
      (await api.admin.fixedPages.get({ id: created.id })).content,
    ).toEqual({ body: "連絡先", extra: [1, 2] });
  });

  test("作成と更新では、使われている slug を SLUG_TAKEN で断る", async () => {
    const { api } = setUp();
    const content = { body: "本文" };

    expect(
      (
        await safe(
          api.admin.fixedPages.create({
            kind: "page",
            slug: "about",
            title: "About 2",
            content,
          }),
        )
      ).error,
    ).toMatchObject({ code: "SLUG_TAKEN" });
    expect(
      (
        await safe(
          api.admin.fixedPages.update({
            id: COLOPHON_ID,
            slug: "about",
            title: "Colophon",
            content,
          }),
        )
      ).error,
    ).toMatchObject({ code: "SLUG_TAKEN" });
  });

  test("種類の定義に合わない中身は INVALID_CONTENT で場所を添えて断り、無い種類は UNKNOWN_KIND で断る", async () => {
    const { api } = setUp();

    expect(
      (
        await safe(
          api.admin.fixedPages.create({
            kind: "page",
            slug: "contact",
            title: "Contact",
            content: { note: "" },
          }),
        )
      ).error,
    ).toMatchObject({
      code: "INVALID_CONTENT",
      data: { issues: [{ path: ["body"] }, { path: ["note"] }] },
    });
    expect(
      (
        await safe(
          api.admin.fixedPages.create({
            kind: "post",
            slug: "contact",
            title: "Contact",
            content: {},
          }),
        )
      ).error,
    ).toMatchObject({ code: "UNKNOWN_KIND" });
  });

  test("更新は中身を丸ごと置き換え、変わったときだけ updatedAt を進める", async () => {
    const { api } = setUp();
    const before = await api.admin.fixedPages.get({ id: ABOUT_ID });
    const same = await api.admin.fixedPages.update({
      id: ABOUT_ID,
      slug: "about",
      title: "About",
      content: { body: "自己紹介" },
    });
    const changed = await api.admin.fixedPages.update({
      id: ABOUT_ID,
      slug: "about-me",
      title: "About me",
      content: { body: "はじめまして" },
    });

    expect(same.updatedAt).toBe(before.updatedAt);
    expect(changed).toMatchObject({
      slug: "about-me",
      title: "About me",
      content: { body: "はじめまして" },
    });
    expect(changed.updatedAt > before.updatedAt).toBe(true);
  });

  test("公開し直しても公開した日時を変えず、非公開に戻すと消す", async () => {
    const { api } = setUp();
    const before = await api.admin.fixedPages.get({ id: ABOUT_ID });

    expect(await api.admin.fixedPages.publish({ id: ABOUT_ID })).toMatchObject({
      published: true,
      publishedAt: before.publishedAt,
    });
    expect(
      await api.admin.fixedPages.unpublish({ id: ABOUT_ID }),
    ).toMatchObject({ published: false, publishedAt: null });
  });

  test("並べ直しは渡した順に振り直し、ID が食い違えば ORDER_MISMATCH で断る", async () => {
    const { api } = setUp();

    expect(
      (
        await api.admin.fixedPages.reorder({
          ids: [COLOPHON_ID.toUpperCase(), ABOUT_ID],
        })
      ).pages.map(({ title }) => title),
    ).toEqual(["Colophon", "About"]);
    expect(
      (await safe(api.admin.fixedPages.reorder({ ids: [ABOUT_ID] }))).error,
    ).toMatchObject({ code: "ORDER_MISMATCH" });
    expect(
      (
        await safe(
          api.admin.fixedPages.reorder({ ids: [ABOUT_ID, MISSING_ID] }),
        )
      ).error,
    ).toMatchObject({ code: "ORDER_MISMATCH" });
    expect(
      (
        await safe(
          api.admin.fixedPages.reorder({
            ids: [ABOUT_ID, ABOUT_ID.toUpperCase()],
          }),
        )
      ).error,
    ).toMatchObject({ code: "ORDER_MISMATCH" });
  });

  test("削除したページは一覧から消え、無いページの操作は NOT_FOUND にする", async () => {
    const { api } = setUp();

    await api.admin.fixedPages.delete({ id: ABOUT_ID });

    expect(await titles(api)).toEqual(["Colophon"]);

    const results = await Promise.all([
      safe(api.admin.fixedPages.get({ id: ABOUT_ID })),
      safe(api.admin.fixedPages.publish({ id: ABOUT_ID })),
      safe(api.admin.fixedPages.unpublish({ id: ABOUT_ID })),
      safe(api.admin.fixedPages.delete({ id: ABOUT_ID })),
      safe(api.admin.kinds.get({ name: "post" })),
    ]);

    expect(results.map(({ error }) => error)).toMatchObject(
      results.map(() => ({ code: "NOT_FOUND" })),
    );
  });

  test("次の1回だけ、決めた応答を返す", async () => {
    const { api, server } = setUp();

    server.replyNext("admin/fixedPages/reorder", () => ({
      error: "ORDER_MISMATCH",
    }));

    expect(
      (
        await safe(
          api.admin.fixedPages.reorder({ ids: [COLOPHON_ID, ABOUT_ID] }),
        )
      ).error,
    ).toMatchObject({ code: "ORDER_MISMATCH" });
    expect(
      await api.admin.fixedPages.reorder({ ids: [COLOPHON_ID, ABOUT_ID] }),
    ).toMatchObject({ pages: [{ id: COLOPHON_ID }, { id: ABOUT_ID }] });
    expect(server.pages().map(({ slug }) => slug)).toEqual([
      "colophon",
      "about",
    ]);
  });
});
