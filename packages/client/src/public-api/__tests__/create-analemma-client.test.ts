import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { describe, expect, expectTypeOf, test } from "bun:test";
import { z } from "zod";

import {
  contract,
  type FixedPageContent,
  type PublishedImageValue,
} from "@analemma/contract";

import { defineKind } from "../../kinds/define-kind";
import {
  boolean,
  optional,
  text,
  image,
  group,
  repeat,
} from "../../kinds/fields";
import {
  type AnalemmaClient,
  type PublishedImage,
  createAnalemmaClient,
} from "../create-analemma-client";

const about = defineKind({
  name: "about",
  label: "自己紹介",
  fields: {
    headline: text({ label: "見出し" }),
    note: optional(text({ label: "メモ" })),
    showContact: boolean({ label: "連絡先を出す", default: true }),
    toc: boolean({ label: "目次を出す" }),
  },
});

const PAGE = {
  kind: "about",
  slug: "about",
  title: "自己紹介",
  publishedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const os = implement({ public: { fixedPages: contract.public.fixedPages } });

const serveFakeCms = (
  content: FixedPageContent,
): ((request: Request) => Promise<Response>) => {
  const handler = new RPCHandler(
    os.router({
      public: {
        fixedPages: {
          list: os.public.fixedPages.list.handler(({ input }) => ({
            pages: input.kind === "colophon" ? [] : [PAGE],
          })),
          get: os.public.fixedPages.get.handler(({ errors, input }) => {
            if (input.slug !== "about") {
              throw errors.NOT_FOUND();
            }

            if (input.kind !== "about") {
              throw new Error("テスト用の CMS の想定外の失敗");
            }

            return { ...PAGE, content };
          }),
        },
      },
    }),
  );

  return async (request) => {
    const { response } = await handler.handle(request, {
      prefix: "/api",
      context: {},
    });

    return response ?? new Response(null, { status: 404 });
  };
};

const clientFor = (content: FixedPageContent): AnalemmaClient =>
  createAnalemmaClient({
    url: "http://127.0.0.1:8788",
    fetch: serveFakeCms(content),
  });

describe("公開している固定ページを引く", () => {
  test("種類の定義で中身を検査し、推論した型で返すこと", async () => {
    const page = await clientFor({
      headline: "こんにちは",
      removed: "古い項目",
    }).fixedPages.get(about, "about");

    expect(page).toEqual({
      ...PAGE,
      content: { headline: "こんにちは", showContact: true, toc: false },
    });

    const expected = z.object({
      headline: z.string(),
      note: z.string().optional(),
      showContact: z.boolean(),
      toc: z.boolean(),
    });

    expectTypeOf(page?.content).toEqualTypeOf<
      z.output<typeof expected> | undefined
    >();
  });

  test("繰り返しの中の画像を、取得できたかで判別できる型で返すこと", async () => {
    const kind = defineKind({
      name: "about",
      label: "自己紹介",
      fields: {
        album: group({
          label: "アルバム",
          fields: {
            pages: repeat({
              label: "ページ",
              fields: { photo: optional(image({ label: "写真" })) },
            }),
          },
        }),
      },
    });

    const unavailable: PublishedImageValue = { available: false };
    const content = { album: { pages: [{ photo: unavailable }, {}] } };
    const page = await clientFor(content).fixedPages.get(kind, "about");
    expect(page?.content).toEqual(content);
    const photo = page?.content.album.pages[0]?.photo;
    expectTypeOf(photo).toEqualTypeOf<PublishedImageValue | undefined>();

    if (photo?.available === true) {
      expectTypeOf(photo.image).toEqualTypeOf<PublishedImage>();
    }
  });

  test("画像の項目を消した定義を送った後も、古い定義では画像を取得できないページとして読めること", async () => {
    const kind = defineKind({
      name: "about",
      label: "自己紹介",
      fields: { photo: image({ label: "写真" }) },
    });

    const page = await clientFor({ photo: crypto.randomUUID() }).fixedPages.get(
      kind,
      "about",
    );

    expect(page?.content.photo).toEqual({ available: false });
  });

  test("値の無い真偽値の項目は、項目の既定値を入れて返すこと", async () => {
    const page = await clientFor({
      headline: "a",
      toc: true,
    }).fixedPages.get(about, "about");

    expect(page?.content).toEqual({
      headline: "a",
      showContact: true,
      toc: true,
    });
  });

  test("無いページは undefined を返すこと", async () => {
    expect(
      await clientFor({ headline: "a" }).fixedPages.get(about, "nothing"),
    ).toBeUndefined();
  });

  test("slug の形に合わない名前は、公開 API を呼ばずに undefined を返すこと", async () => {
    const requests: string[] = [];
    const fake = serveFakeCms({ headline: "a" });

    const client = createAnalemmaClient({
      url: "http://127.0.0.1:8788",
      fetch: async (request) => {
        requests.push(request.url);

        return fake(request);
      },
    });

    for (const slug of ["About", "about me", "../about", "", "a".repeat(101)]) {
      expect(await client.fixedPages.get(about, slug)).toBeUndefined();
    }

    expect(requests).toEqual([]);
    expect(await client.fixedPages.get(about, "about")).toBeDefined();
    expect(requests).toHaveLength(1);
  });

  test("CMS の想定外の失敗と、定義に合わない中身は、失敗として投げること", () => {
    const other = defineKind({
      name: "other",
      label: "ほか",
      fields: { headline: text({ label: "見出し" }) },
    });

    expect(
      clientFor({ headline: "a" }).fixedPages.get(other, "about"),
    ).rejects.toThrow();
    expect(clientFor({}).fixedPages.get(about, "about")).rejects.toThrow();
  });
});

describe("CMS へのリクエスト", () => {
  test("リダイレクトを追わず、失敗として扱わせること", async () => {
    const redirects: string[] = [];
    const fake = serveFakeCms({ headline: "a" });

    const client = createAnalemmaClient({
      url: "http://127.0.0.1:8788",
      fetch: async (request) => {
        redirects.push(request.redirect);

        return fake(request);
      },
    });

    await client.fixedPages.get(about, "about");
    await client.fixedPages.list();

    expect(redirects).toEqual(["error", "error"]);
  });
});

describe("公開している固定ページの一覧", () => {
  test("種類で絞った一覧を返すこと", async () => {
    const client = clientFor({ headline: "a" });

    expect(await client.fixedPages.list()).toEqual([PAGE]);
    expect(await client.fixedPages.list({ kind: "colophon" })).toEqual([]);
  });
});
