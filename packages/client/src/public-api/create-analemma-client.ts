import { createORPCClient, ORPCError, safe } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";
import { z } from "zod";

import { type contract, fixedPageSlug, imageId } from "@analemma/contract";

import type { AnyKind, KindContent } from "../kinds/define-kind";

type PublicRouter = Pick<typeof contract, "public">;
type PublicOutputs = InferContractRouterOutputs<PublicRouter>["public"];
type FixedPageOutputs = PublicOutputs["fixedPages"];

/** 公開している画像。 */
export type PublishedImage = PublicOutputs["images"]["get"];
/** 公開しているコレクションと、その画像。 */
export type PublishedCollection = PublicOutputs["collections"]["get"];
/** 公開しているコレクションの一覧の1件。 */
export type CollectionSummary =
  PublicOutputs["collections"]["list"]["collections"][number];

/** 公開している固定ページの一覧の1件。 */
export type FixedPageSummary = FixedPageOutputs["list"]["pages"][number];

/** 一覧を絞る条件。 */
export type FixedPageFilter =
  InferContractRouterInputs<PublicRouter>["public"]["fixedPages"]["list"];

/** 種類の定義から推論した型の中身を持つ、公開している固定ページ。 */
export type FixedPage<K extends AnyKind> = Omit<
  FixedPageOutputs["get"],
  "content"
> & {
  /** 種類の定義で検査した中身。 */
  readonly content: KindContent<K>;
};

/** CMS の内部用のポートの URL と、リクエストに使う fetch。 */
export type AnalemmaClientOptions = {
  /** CMS の内部用のポートの URL(`http://127.0.0.1:8788` など)。 */
  readonly url: string;
  /** リクエストに使う fetch。 */
  readonly fetch?: (request: Request) => Promise<Response>;
};

/** 公開 API を呼ぶ client。 */
export type AnalemmaClient = {
  /** 公開している画像を読む関数。 */
  readonly images: {
    /** ID で画像を引く。 */
    readonly get: (id: string) => Promise<PublishedImage | undefined>;
  };
  /** 公開しているコレクションを読む関数。 */
  readonly collections: {
    /** slug でコレクションを引く。 */
    readonly get: (slug: string) => Promise<PublishedCollection | undefined>;
    /** コレクションを新しく作った順に並べる。 */
    readonly list: () => Promise<CollectionSummary[]>;
  };
  /** 公開している固定ページを読む関数。 */
  readonly fixedPages: {
    /** 種類と slug で固定ページを引く。 */
    readonly get: <K extends AnyKind>(
      kind: K,
      slug: string,
    ) => Promise<FixedPage<K> | undefined>;
    /** 公開している固定ページを、並び順に並べる。 */
    readonly list: (filter?: FixedPageFilter) => Promise<FixedPageSummary[]>;
  };
};

const getOrUndefined = async <T>(
  request: Promise<T>,
): Promise<T | undefined> => {
  const { data, error } = await safe(request);

  if (error === null) return data;

  if (
    error instanceof ORPCError &&
    error.defined &&
    error.code === "NOT_FOUND"
  ) {
    return undefined;
  }

  throw error;
};

/** 公開サイトのサーバーから、CMS の公開 API を呼ぶ client を作る。 */
export const createAnalemmaClient = ({
  fetch = async (request) => globalThis.fetch(request),
  url,
}: AnalemmaClientOptions): AnalemmaClient => {
  const client: ContractRouterClient<PublicRouter> = createORPCClient(
    new RPCLink({
      url: new URL("/api", url).href,
      fetch: async (request) =>
        fetch(new Request(request, { redirect: "error" })),
    }),
  );

  return {
    images: {
      get: async (id) =>
        imageId.safeParse(id).success
          ? getOrUndefined(client.public.images.get({ id }))
          : undefined,
    },
    collections: {
      get: async (slug) =>
        fixedPageSlug.safeParse(slug).success
          ? getOrUndefined(client.public.collections.get({ slug }))
          : undefined,
      list: async () => (await client.public.collections.list()).collections,
    },
    fixedPages: {
      get: async <K extends AnyKind>(
        kind: K,
        slug: string,
      ): Promise<FixedPage<K> | undefined> => {
        if (!fixedPageSlug.safeParse(slug).success) {
          return undefined;
        }

        const data = await getOrUndefined(
          client.public.fixedPages.get({ kind: kind.name, slug }),
        );

        if (data === undefined) return undefined;

        return {
          ...data,
          content: z.parse<K["content"]>(kind.content, data.content),
        };
      },
      list: async (filter = {}) =>
        (await client.public.fixedPages.list(filter)).pages,
    },
  };
};
