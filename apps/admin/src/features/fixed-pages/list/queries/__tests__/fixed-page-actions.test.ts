import { describe, expect, test } from "bun:test";

import {
  deleteFixedPage,
  reorderFixedPages,
  setPublication,
} from "@/features/fixed-pages/list/queries/fixed-page-actions";
import { createFakeApi } from "@/testing/create-fake-api";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";

const setUp = () => {
  const server = createFixedPageRoutes({
    kinds: [{ name: "page", label: "基本のページ", fields: [] }],
    pages: [
      { kind: "page", slug: "about", title: "About" },
      { kind: "page", slug: "colophon", title: "Colophon", published: true },
    ],
  });

  const [about, colophon] = server.pages().map(({ id }) => id);

  return {
    server,
    api: createFakeApi(server.routes).api,
    about: about ?? "",
    colophon: colophon ?? "",
  };
};

const MISSING_ID = "019a0000-0000-7000-8000-0000000000ff";

describe("setPublication", () => {
  test("公開と非公開を切り替え、無いページは NotFound にする", async () => {
    const { api, server, about, colophon } = setUp();

    expect(await setPublication(api, { id: about, published: true })).toEqual({
      _tag: "Published",
    });
    expect(
      await setPublication(api, { id: colophon, published: false }),
    ).toEqual({
      _tag: "Unpublished",
    });
    expect(server.pages().map(({ published }) => published)).toEqual([
      true,
      false,
    ]);
    expect(
      await setPublication(api, { id: MISSING_ID, published: true }),
    ).toEqual({
      _tag: "NotFound",
    });
  });
});

describe("deleteFixedPage", () => {
  test("削除し、もう無いページは NotFound にする", async () => {
    const { api, server, about } = setUp();

    expect(await deleteFixedPage(api, about)).toEqual({ _tag: "Deleted" });
    expect(server.pages().map(({ slug }) => slug)).toEqual(["colophon"]);
    expect(await deleteFixedPage(api, about)).toEqual({ _tag: "NotFound" });
  });
});

describe("reorderFixedPages", () => {
  test("並べ直し、ほかで増えたページがあれば OrderMismatch にする", async () => {
    const { api, server, about, colophon } = setUp();

    expect(await reorderFixedPages(api, [colophon, about])).toEqual({
      _tag: "Reordered",
    });
    expect(server.pages().map(({ slug }) => slug)).toEqual([
      "colophon",
      "about",
    ]);

    await api.admin.fixedPages.create({
      kind: "page",
      slug: "contact",
      title: "Contact",
      content: {},
    });

    expect(await reorderFixedPages(api, [about, colophon])).toEqual({
      _tag: "OrderMismatch",
    });
  });
});
