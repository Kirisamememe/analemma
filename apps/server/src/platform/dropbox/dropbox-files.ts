import { z } from "zod";

import type {
  DropboxApi,
  DropboxFile,
  DropboxUnauthorized,
} from "@/platform/dropbox/dropbox-api";
import type { DropboxFetch } from "@/platform/dropbox/dropbox-oauth";

const API = "https://api.dropboxapi.com/2";
const CONTENT = "https://content.dropboxapi.com/2";
const PAGE_LIMIT = 2000;

const fileMetadata = z.object({
  ".tag": z.literal("file").optional(), // download の結果には無い
  id: z.string().startsWith("id:"),
  path_display: z.string().startsWith("/"),
  size: z.int().nonnegative(),
  server_modified: z.iso.datetime(),
  content_hash: z.string().regex(/^[0-9a-f]{64}$/v),
  is_downloadable: z.boolean().default(true),
});

const listPage = z.object({
  entries: z.array(
    z.union([
      fileMetadata,
      z.object({ ".tag": z.enum(["folder", "deleted"]) }),
    ]),
  ),
  cursor: z.string(),
  has_more: z.boolean(),
});

const account = z.object({
  account_id: z.string(),
  name: z.object({ display_name: z.string() }),
  email: z.string(),
});

const conflict = z.object({ error_summary: z.string() });

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

/** 一覧の1ページ。 */
type ListPage = z.output<typeof listPage>;

const toFile = (metadata: z.output<typeof fileMetadata>): DropboxFile => ({
  id: metadata.id,
  path: metadata.path_display,
  size: metadata.size,
  modifiedAt: new Date(metadata.server_modified),
  contentHash: metadata.content_hash,
});

const escapeUnit = (unit: string): string =>
  `\\u${(unit.codePointAt(0) ?? 0).toString(16).padStart(4, "0")}`;

const toHeaderSafeJson = (value: unknown): string =>
  JSON.stringify(value).replaceAll(/[\u007F-\u{10FFFF}]/gv, (character) =>
    character
      .split("") // UTF-16 の単位ごとに escape
      .map((unit) => escapeUnit(unit))
      .join(""),
  );

const unexpected = (action: string, response: Response): Error =>
  new Error(`Dropbox の ${action} が ${response.status} を返した`);

/** Dropbox のアカウントを読む部分を作る。 */
export const createDropboxFiles = (
  send: DropboxFetch,
): Pick<DropboxApi, "getAccount" | "listFiles" | "download"> => {
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

  const readPage = async (
    call: RpcCall,
  ): Promise<ListPage | DropboxUnauthorized> => {
    const response = await postRpc(call);

    if (response.status === 401) return { _tag: "Unauthorized" };

    if (!response.ok) throw unexpected("ファイルの一覧", response);

    return listPage.parse(await response.json());
  };

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
    listFiles: async (accessToken, signal) => {
      const files: DropboxFile[] = [];
      let call: RpcCall = {
        accessToken,
        endpoint: "files/list_folder",
        body: {
          path: "",
          recursive: true,
          include_non_downloadable_files: false,
          limit: PAGE_LIMIT,
        },
        signal,
      };

      for (;;) {
        // oxlint-disable-next-line eslint/no-await-in-loop -- 次のページは前のページの cursor で読む
        const page = await readPage(call);

        if ("_tag" in page) return page;

        for (const entry of page.entries) {
          if ("id" in entry && entry.is_downloadable) files.push(toFile(entry));
        }

        if (!page.has_more) return { _tag: "Listed", files };

        call = {
          accessToken,
          endpoint: "files/list_folder/continue",
          body: { cursor: page.cursor },
          signal,
        };
      }
    },
    download: async (accessToken, { fileId, maxBytes }) => {
      const response = await send(
        new Request(`${CONTENT}/files/download`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "dropbox-api-arg": toHeaderSafeJson({ path: fileId }),
          },
        }),
      );

      if (response.status === 401) return { _tag: "Unauthorized" };

      if (response.status === 409) {
        const { error_summary } = conflict.parse(await response.json());

        if (error_summary.startsWith("path/not_found/")) {
          return { _tag: "NotFound" };
        }
      }

      if (!response.ok) throw unexpected("ファイルの読み取り", response);

      const file = toFile(
        fileMetadata.parse(
          JSON.parse(response.headers.get("dropbox-api-result") ?? ""),
        ),
      );

      if (file.size > maxBytes) {
        await response.body?.cancel();

        return { _tag: "TooLarge" };
      }

      const bytes = new Uint8Array(await response.arrayBuffer());

      if (bytes.byteLength !== file.size) {
        throw new Error("Dropbox から読んだファイルの大きさが合わない");
      }

      return { _tag: "Downloaded", file, bytes };
    },
  };
};
