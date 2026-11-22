import { createORPCClient, isDefinedError, safe } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type {
  ContractRouterClient,
  InferContractRouterErrorMap,
  InferContractRouterOutputs,
  InferSchemaOutput,
} from "@orpc/contract";

import type { KindDefinition, contract } from "@analemma/contract";

type DeployRouter = Pick<typeof contract, "deploy">;

type IncompatibleData = InferSchemaOutput<
  InferContractRouterErrorMap<DeployRouter>["INCOMPATIBLE_PAGES"]["data"]
>;

/** 種類ごとの、送った定義での変わり方。 */
export type KindChange =
  InferContractRouterOutputs<DeployRouter>["deploy"]["kinds"]["push"]["kinds"][number];

/** CMS が定義を受け付けたこと。 */
export type AcceptedKinds = {
  /** どの結果か。 */
  readonly _tag: "Accepted";
  /** 種類ごとの変わり方。 */
  readonly kinds: KindChange[];
};

/** 既存の固定ページに合わず、CMS が定義を断ったこと。 */
export type IncompatibleKinds = {
  /** どの結果か。 */
  readonly _tag: "Incompatible";
  /** 新しい定義に合わない固定ページ。 */
  readonly pages: IncompatibleData["pages"];
};

/** デプロイ用のトークンを、CMS が受け付けなかったこと。 */
export type UnauthorizedPush = {
  /** どの結果か。 */
  readonly _tag: "Unauthorized";
};

/** 定義を送る先と、送る定義。 */
export type KindPush = {
  /** CMS の内部用のポートの URL。 */
  readonly url: string;
  /** デプロイ用のトークン。 */
  readonly token: string;
  /** 送る種類の定義。 */
  readonly kinds: KindDefinition[];
  /** リクエストに使う fetch。 */
  readonly fetch: (request: Request) => Promise<Response>;
};

/** 種類の定義を、CMS のデプロイ用 API に送る。 */
export const pushKindDefinitions = async ({
  fetch,
  kinds,
  token,
  url,
}: KindPush): Promise<AcceptedKinds | IncompatibleKinds | UnauthorizedPush> => {
  const client: ContractRouterClient<DeployRouter> = createORPCClient(
    new RPCLink({
      url: new URL("/api", url).href,
      headers: { authorization: `Bearer ${token}` },
      fetch: async (request) =>
        fetch(new Request(request, { redirect: "error" })),
    }),
  );
  const { data, error } = await safe(client.deploy.kinds.push({ kinds }));

  if (error === null) {
    return { _tag: "Accepted", kinds: data.kinds };
  }

  if (isDefinedError(error)) {
    switch (error.code) {
      case "INCOMPATIBLE_PAGES":
        return { _tag: "Incompatible", pages: error.data.pages };
      case "UNAUTHORIZED":
        return { _tag: "Unauthorized" };
    }
  }

  throw error;
};
