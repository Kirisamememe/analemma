import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useReorderFixedPages } from "@/features/fixed-pages/list/use-reorder-fixed-pages";
import type { FakeReply } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const server = createFixedPageRoutes({
    kinds: [{ name: "page", label: "基本のページ", fields: [] }],
    pages: [
      { kind: "page", slug: "about", title: "About" },
      { kind: "page", slug: "colophon", title: "Colophon" },
      { kind: "page", slug: "contact", title: "連絡先" },
    ],
  });

  const app = createTestApp({ path: "/enroll", routes: server.routes });
  await app.router.load();

  const { result } = renderHook(useReorderFixedPages, {
    wrapper: withAppProviders(app),
  });

  const pages = server.pages();
  const ids = pages.map(({ id }) => id);
  const slugs = () => result.current.arrange(pages).map(({ slug }) => slug);

  return { server, result, ids, slugs };
};

describe("useReorderFixedPages", () => {
  test("送っている間は送った順に並べて保存中を返し、届いたら渡した並びに戻す", async () => {
    const { server, result, ids, slugs } = await setUp();
    const [about, colophon, contact] = ids;
    const sent = [String(contact), String(about), String(colophon)];

    const reply =
      Promise.withResolvers<FakeReply<"admin/fixedPages/reorder">>();

    server.replyNext("admin/fixedPages/reorder", () => reply.promise);
    act(() => {
      result.current.reorder(sent);
    });

    expect(result.current.isSaving).toBe(true);
    expect(slugs()).toEqual(["contact", "about", "colophon"]);

    reply.resolve(server.routes["admin/fixedPages/reorder"]({ ids: sent }));

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
    expect(slugs()).toEqual(["about", "colophon", "contact"]);
  });

  test("送れなかったら、渡した並びに戻す", async () => {
    const { server, result, ids, slugs } = await setUp();

    server.replyNext("admin/fixedPages/reorder", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    act(() => {
      result.current.reorder(ids.toReversed());
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
    expect(slugs()).toEqual(["about", "colophon", "contact"]);
  });
});
