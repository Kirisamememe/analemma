import { createORPCClient, isDefinedError, safe } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";
import { z } from "zod";

import type { contract } from "@analemma/contract";

import type { AnyKind, KindContent } from "../kinds/define-kind";

type PublicRouter = Pick<typeof contract, "public">;
type FixedPageOutputs =
  InferContractRouterOutputs<PublicRouter>["public"]["fixedPages"];

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

/** 公開サイトのサーバーから、CMS の公開 API を呼ぶ client を作る。 */
export const createAnalemmaClient = ({
  fetch,
  url,
}: AnalemmaClientOptions): AnalemmaClient => {
  const client: ContractRouterClient<PublicRouter> = createORPCClient(
    new RPCLink({
      url: new URL("/api", url).href,
      ...(fetch === undefined
        ? {}
        : { fetch: async (request) => fetch(request) }),
    }),
  );

  return {
    fixedPages: {
      get: async <K extends AnyKind>(
        kind: K,
        slug: string,
      ): Promise<FixedPage<K> | undefined> => {
        const { data, error } = await safe(
          client.public.fixedPages.get({ kind: kind.name, slug }),
        );

        if (error !== null) {
          if (isDefinedError(error)) {
            return undefined;
          }

          throw error;
        }

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
