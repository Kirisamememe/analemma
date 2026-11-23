import { z } from "zod";

import type { DropboxApi } from "@/platform/dropbox/dropbox-api";
import type { DropboxFetch } from "@/platform/dropbox/dropbox-oauth";

const API = "https://api.dropboxapi.com/2";

const account = z.object({
  account_id: z.string(),
  name: z.object({ display_name: z.string() }),
  email: z.string(),
});

/** Dropbox の RPC の endpoint への呼び出し。 */
type RpcCall = {
  /** access token。 */
  readonly accessToken: string;
  /** `/2/` に続く endpoint。 */
  readonly endpoint: string;
  /** JSON にする引数(引数の無い endpoint は省く)。 */
  readonly body?: unknown;
  /** 呼び出しをやめる signal。 */
  readonly signal?: AbortSignal | undefined;
};

const unexpected = (action: string, response: Response): Error =>
  new Error(`Dropbox の ${action} が ${response.status} を返した`);

/** Dropbox のアカウントとファイルを読む部分を作る。 */
export const createDropboxFiles = (
  send: DropboxFetch,
): Pick<DropboxApi, "getAccount"> => {
  const postRpc = async ({
    accessToken,
    endpoint,
    body,
    signal,
  }: RpcCall): Promise<Response> =>
    send(
      new Request(`${API}/${endpoint}`, {
        method: "POST",
        headers:
          body === undefined
            ? { authorization: `Bearer ${accessToken}` }
            : {
                authorization: `Bearer ${accessToken}`,
                "content-type": "application/json",
              },
        body: body === undefined ? null : JSON.stringify(body),
        signal: signal ?? null,
      }),
    );

  return {
    getAccount: async (accessToken, signal) => {
      const response = await postRpc({
        accessToken,
        endpoint: "users/get_current_account",
        signal,
      });

      if (response.status === 401) return { _tag: "Unauthorized" };

      if (!response.ok) throw unexpected("アカウントの読み取り", response);

      const body = account.parse(await response.json());

      return {
        _tag: "Account",
        accountId: body.account_id,
        name: body.name.display_name,
        email: body.email,
      };
    },
  };
};
