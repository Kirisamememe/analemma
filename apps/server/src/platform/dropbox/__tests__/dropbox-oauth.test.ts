import { describe, expect, test } from "bun:test";

import { createDropboxApi } from "@/platform/dropbox/create-dropbox-api";
import {
  createFakeDropbox,
  TEST_DROPBOX_APP,
} from "@/test-client/create-fake-dropbox";

const REDIRECT_URI = "https://analemma.test/images/dropbox/callback";

/** 作り物の Dropbox に届いたリクエスト。 */
type SentRequest = {
  /** URL。 */
  readonly url: string;
  /** Authorization ヘッダー。 */
  readonly authorization: string | null;
  /** 本文。 */
  readonly body: string;
};

const prepare = () => {
  const dropbox = createFakeDropbox();
  const sent: SentRequest[] = [];

  const api = createDropboxApi(TEST_DROPBOX_APP, async (request) => {
    sent.push({
      url: request.url,
      authorization: request.headers.get("authorization"),
      body: await request.clone().text(),
    });

    return dropbox.fetch(request);
  });

  return { api, dropbox, sent };
};

const replying = (status: number) =>
  createDropboxApi(TEST_DROPBOX_APP, () =>
    Promise.resolve(Response.json({ error: "invalid_client" }, { status })),
  );

const authorized = async ({ api, dropbox }: ReturnType<typeof prepare>) => {
  const { url } = api.authorize(REDIRECT_URI);
  const { code } = dropbox.approve(url);
  const exchanged = await api.exchangeCode({ code, redirectUri: REDIRECT_URI });

  if (exchanged._tag !== "Authorized") throw new Error("つなげなかった");

  return exchanged;
};

describe("createDropboxApi の OAuth", () => {
  test("app secret を URL と本文に書かず、HTTP Basic で送ること", async () => {
    const prepared = prepare();

    await authorized(prepared);

    const [token] = prepared.sent;

    expect(token?.url).toBe("https://api.dropboxapi.com/oauth2/token");
    expect(token?.authorization).toBe(
      `Basic ${btoa(`${TEST_DROPBOX_APP.appKey}:${TEST_DROPBOX_APP.appSecret}`)}`,
    );
    expect(token?.url).not.toContain(TEST_DROPBOX_APP.appSecret);
    expect(token?.body).not.toContain(TEST_DROPBOX_APP.appSecret);
  });

  test("認可の画面ごとに、推し量れない別の state を作ること", () => {
    const { api } = prepare();
    const first = api.authorize(REDIRECT_URI).state;

    expect(first).not.toBe(api.authorize(REDIRECT_URI).state);
    expect(first).toHaveLength(43);
  });

  test("使った code と、別の redirect URI の code は断られたと返すこと", async () => {
    const prepared = prepare();
    const { api, dropbox } = prepared;
    const { code } = dropbox.approve(api.authorize(REDIRECT_URI).url);

    expect(
      await api.exchangeCode({ code, redirectUri: `${REDIRECT_URI}/other` }),
    ).toEqual({ _tag: "Rejected" });
    expect(await api.exchangeCode({ code, redirectUri: REDIRECT_URI })).toEqual(
      {
        _tag: "Rejected",
      },
    );
  });

  test("取り消した認可は、refresh token で更新できないと返すこと", async () => {
    const prepared = prepare();
    const { api } = prepared;
    const { accessToken, refreshToken } = await authorized(prepared);

    expect(await api.refresh(refreshToken)).toMatchObject({
      _tag: "Refreshed",
      expiresInSeconds: 14_400,
    });
    expect(await api.revoke(accessToken)).toBe(true);
    expect(await api.refresh(refreshToken)).toEqual({ _tag: "Revoked" });
    expect(await api.revoke(accessToken)).toBe(true);
  });

  test("Dropbox が取り消しを断ったら、false を返すこと", async () => {
    const api = createDropboxApi(TEST_DROPBOX_APP, () =>
      Promise.resolve(
        Response.json({ error_summary: "internal" }, { status: 500 }),
      ),
    );

    expect(await api.revoke("token")).toBe(false);
  });

  test("refresh token の更新を 4xx で断られたら取り消し済みとし、5xx は失敗とすること", async () => {
    expect(await replying(401).refresh("token")).toEqual({ _tag: "Revoked" });
    expect(replying(503).refresh("token")).rejects.toThrow("503");
    expect(replying(429).refresh("token")).rejects.toThrow("429");
  });
});
