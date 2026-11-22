import { describe, expect, test } from "bun:test";

import { createApiClient, type ApiClientOptions } from "../create-api-client";

/** 送ったリクエストの、確かめる部分。 */
type Sent = {
  /** 送った先。 */
  readonly url: string;
  /** メソッド。 */
  readonly method: string;
};

/** 送ったリクエストを覚える、作り物の fetch。 */
type Recorder = {
  /** 送ったリクエスト。 */
  readonly sent: readonly Sent[];
  /** client に渡す fetch。 */
  readonly fetch: ApiClientOptions["fetch"];
};

const recordRequests = (): Recorder => {
  const sent: Sent[] = [];

  return {
    sent,
    fetch: (request) => {
      sent.push({ url: request.url, method: request.method });

      return Promise.resolve(
        Response.json({ json: { expiresAt: "2026-01-01T00:00:00.000Z" } }),
      );
    },
  };
};

describe("createApiClient", () => {
  test("同じ origin の /api の下に、procedure のパスで送る", async () => {
    const { sent, fetch } = recordRequests();
    const api = createApiClient({ origin: "http://localhost:5173", fetch });

    await api.admin.session.get();

    expect(sent).toEqual([
      { url: "http://localhost:5173/api/admin/session/get", method: "POST" },
    ]);
  });

  test("server の応答を、contract の出力の形で返す", async () => {
    const { fetch } = recordRequests();
    const api = createApiClient({ origin: "http://localhost:5173", fetch });

    expect(await api.admin.session.get()).toEqual({
      expiresAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
