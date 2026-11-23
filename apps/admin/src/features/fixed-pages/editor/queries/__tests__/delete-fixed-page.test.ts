import { describe, expect, test } from "bun:test";

import { deleteFixedPage } from "@/features/fixed-pages/editor/queries/delete-fixed-page";
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

describe("deleteFixedPage", () => {
  test("削除し、もう無いページは NotFound にする", async () => {
    const { api, server, about } = setUp();

    expect(await deleteFixedPage(api, about)).toEqual({ _tag: "Deleted" });
    expect(server.pages().map(({ slug }) => slug)).toEqual(["colophon"]);
    expect(await deleteFixedPage(api, about)).toEqual({ _tag: "NotFound" });
  });
});
