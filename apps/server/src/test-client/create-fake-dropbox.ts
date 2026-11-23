import { z } from "zod";

import type { DropboxAppCredential } from "@/platform/dropbox/dropbox-oauth";

/** テストの Dropbox のアプリの app key と app secret。 */
export const TEST_DROPBOX_APP: DropboxAppCredential = {
  appKey: "testappkey",
  appSecret: "testappsecret",
};

/** テストの Dropbox のアカウント。 */
export const TEST_DROPBOX_ACCOUNT = {
  account_id: "dbid:test-account",
  name: { display_name: "Kirisame Test" },
  email: "photos@example.com",
};

/** App folder に置いたファイル。 */
type FakeFile = {
  /** ファイルの ID。 */
  readonly id: string;
  /** App folder の中のパス。 */
  readonly path: string;
  /** 中身。 */
  readonly bytes: Uint8Array;
  /** Dropbox と同じ求め方の content_hash。 */
  readonly contentHash: string;
  /** 置いた日時。 */
  readonly modifiedAt: string;
};

/** 認可の画面から戻る URL に付く値。 */
export type FakeApproval = {
  /** code。 */
  readonly code: string;
  /** 認可の画面に渡した state。 */
  readonly state: string;
};

/** 止めたリクエスト。 */
export type FakeHold = {
  /** 止めたリクエストが届くと決まる Promise。 */
  readonly reached: Promise<undefined>;
  /** 止めたリクエストを進める。 */
  readonly release: () => void;
};

/** HTTP の API を真似る、作り物の Dropbox。 */
export type FakeDropbox = {
  /** Dropbox へのリクエストを受ける。 */
  readonly fetch: (request: Request) => Promise<Response>;
  /** App folder にファイルを置き、ID を返す。 */
  readonly put: (path: string, bytes: Uint8Array) => Promise<string>;
  /** App folder からファイルを消す。 */
  readonly remove: (path: string) => void;
  /** 利用者が認可の画面で許したことにして、戻る URL の code と state を返す。 */
  readonly approve: (authorizeUrl: string) => FakeApproval;
  /** 利用者が Dropbox の設定からアプリの接続を切ったことにする。 */
  readonly unlink: () => void;
  /** 次に path に届くリクエストを、status で断る。 */
  readonly fail: (path: string, status: number) => void;
  /** 次に path に届くリクエストを、release まで止める。 */
  readonly hold: (path: string) => FakeHold;
  /** 取り消していない refresh token の数。 */
  readonly activeGrants: () => number;
  /** 届いたリクエストの path。 */
  readonly requests: readonly string[];
};

const BLOCK_BYTES = 4 * 1024 * 1024;
const PAGE_SIZE = 2; // ページ送りを確かめるため、小さく区切る

const sha256 = async (bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));

const toContentHash = async (bytes: Uint8Array): Promise<string> => {
  const blocks: Uint8Array[] = [];

  for (let start = 0; start < bytes.byteLength; start += BLOCK_BYTES) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- テストの小さなファイルだけを読む
    blocks.push(await sha256(bytes.slice(start, start + BLOCK_BYTES)));
  }

  const joined = new Uint8Array(blocks.length * 32);

  for (const [index, block] of blocks.entries()) joined.set(block, index * 32);

  return (await sha256(joined)).toHex();
};

const listArgument = z.object({ cursor: z.string().optional() });
const downloadArgument = z.object({ path: z.string() });

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status });

const conflict = (summary: string): Response =>
  json({ error_summary: summary, error: {} }, 409);

const UNAUTHORIZED = (): Response =>
  json({ error_summary: "invalid_access_token/", error: {} }, 401);

const toMetadata = ({
  id,
  path,
  bytes,
  contentHash,
  modifiedAt,
}: FakeFile) => ({
  ".tag": "file",
  id,
  name: path.split("/").at(-1),
  path_lower: path.toLowerCase(),
  path_display: path,
  server_modified: modifiedAt,
  size: bytes.byteLength,
  content_hash: contentHash,
  is_downloadable: true,
});

/** HTTP の API を真似る、作り物の Dropbox を作る。 */
export const createFakeDropbox = (): FakeDropbox => {
  const files = new Map<string, FakeFile>();
  const codes = new Map<string, string>(); // code と、認可の画面に渡した redirect URI
  const grants = new Map<string, string>(); // access token と、その refresh token
  const refreshTokens = new Set<string>();
  const requests: string[] = [];
  const failures = new Map<string, number>();
  const holds = new Map<string, () => Promise<undefined>>();
  let nextId = 1;

  const issueAccess = (refreshToken: string): string => {
    const accessToken = `access-${crypto.randomUUID()}`;

    grants.set(accessToken, refreshToken);

    return accessToken;
  };

  const token = async (request: Request): Promise<Response> => {
    const expected = `Basic ${btoa(`${TEST_DROPBOX_APP.appKey}:${TEST_DROPBOX_APP.appSecret}`)}`;

    if (request.headers.get("authorization") !== expected) {
      return json({ error: "invalid_client" }, 400);
    }

    const form = new URLSearchParams(await request.text());
    const invalidGrant = json({ error: "invalid_grant" }, 400);

    if (form.get("grant_type") === "refresh_token") {
      const refreshToken = form.get("refresh_token") ?? "";

      return refreshTokens.has(refreshToken)
        ? json({ access_token: issueAccess(refreshToken), expires_in: 14_400 })
        : invalidGrant;
    }

    const code = codes.get(form.get("code") ?? "");

    codes.delete(form.get("code") ?? "");

    if (code === undefined || code !== form.get("redirect_uri")) {
      return invalidGrant;
    }

    const refreshToken = `refresh-${crypto.randomUUID()}`;

    refreshTokens.add(refreshToken);

    return json({
      access_token: issueAccess(refreshToken),
      refresh_token: refreshToken,
      expires_in: 14_400,
      token_type: "bearer",
      account_id: TEST_DROPBOX_ACCOUNT.account_id,
    });
  };

  const api = async (request: Request, path: string): Promise<Response> => {
    const accessToken = /^Bearer (.+)$/v.exec(
      request.headers.get("authorization") ?? "",
    )?.[1];

    const refreshToken =
      accessToken === undefined ? undefined : grants.get(accessToken);

    if (refreshToken === undefined || !refreshTokens.has(refreshToken)) {
      return UNAUTHORIZED();
    }

    switch (path) {
      case "/2/auth/token/revoke": {
        refreshTokens.delete(refreshToken);

        return json(null);
      }
      case "/2/users/get_current_account": {
        return json(TEST_DROPBOX_ACCOUNT);
      }
      case "/2/files/list_folder":
      case "/2/files/list_folder/continue": {
        const { cursor } = listArgument.parse(await request.json());
        const start = Number(cursor ?? "0");
        const all = [...files.values()];

        return json({
          entries: [
            ...(start === 0 ? [{ ".tag": "folder", id: "id:folder" }] : []),
            ...all
              .slice(start, start + PAGE_SIZE)
              .map((file) => toMetadata(file)),
          ],
          cursor: String(start + PAGE_SIZE),
          has_more: start + PAGE_SIZE < all.length,
        });
      }
      case "/2/files/download": {
        const { path: id } = downloadArgument.parse(
          JSON.parse(request.headers.get("dropbox-api-arg") ?? "{}"),
        );

        const file = files.get(id);

        if (file === undefined) return conflict("path/not_found/..");

        return new Response(file.bytes, {
          headers: {
            "content-type": "application/octet-stream",
            "dropbox-api-result": JSON.stringify(toMetadata(file)),
          },
        });
      }
      default: {
        return json({ error_summary: "not_found" }, 404);
      }
    }
  };

  return {
    fetch: async (request) => {
      const { pathname } = new URL(request.url);

      requests.push(pathname);
      const hold = holds.get(pathname);

      holds.delete(pathname);
      await hold?.();

      const failure = failures.get(pathname);

      failures.delete(pathname);

      if (failure !== undefined) {
        return json({ error_summary: "internal" }, failure);
      }

      return pathname === "/oauth2/token"
        ? token(request)
        : api(request, pathname);
    },
    put: async (path, bytes) => {
      const id = `id:file${nextId}`;

      nextId += 1;
      files.set(id, {
        id,
        path,
        bytes,
        contentHash: await toContentHash(bytes),
        modifiedAt: `2026-01-01T00:00:${String(nextId).padStart(2, "0")}Z`,
      });

      return id;
    },
    remove: (path) => {
      for (const [id, file] of files) if (file.path === path) files.delete(id);
    },
    approve: (authorizeUrl) => {
      const params = new URL(authorizeUrl).searchParams;
      const code = `code-${crypto.randomUUID()}`;

      codes.set(code, params.get("redirect_uri") ?? "");

      return { code, state: params.get("state") ?? "" };
    },
    fail: (path, status) => {
      failures.set(path, status);
    },
    hold: (path) => {
      const reached = Promise.withResolvers<undefined>();
      const released = Promise.withResolvers<undefined>();

      holds.set(path, async () => {
        reached.resolve(undefined);

        return released.promise;
      });

      return {
        reached: reached.promise,
        release: () => {
          released.resolve(undefined);
        },
      };
    },
    activeGrants: () => refreshTokens.size,
    unlink: () => {
      refreshTokens.clear();
    },
    requests,
  };
};
