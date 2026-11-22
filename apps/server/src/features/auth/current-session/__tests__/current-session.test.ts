import { describe, expect, test } from "bun:test";

import { addTestPasskey } from "../../../../test-client/add-test-passkey";
import {
  SUCCEEDED,
  catchErrorCode,
} from "../../../../test-client/catch-error-code";
import {
  TEST_NOW,
  TEST_ORIGIN,
  type TestBrowser,
  type TestClient,
  createTestClient,
} from "../../../../test-client/create-test-client";
import {
  logInWithPasskey,
  signInAsAdmin,
} from "../../../../test-client/sign-in-as-admin";

const SECOND = 1000;
const HOUR = 60 * 60 * SECOND;
const DAY = 24 * HOUR;

const at = (ms: number): Date => new Date(TEST_NOW.getTime() + ms);

const getSessionRaw = async (
  server: TestClient,
  browser: TestBrowser,
): Promise<Response> =>
  server.app.fetch(
    new Request(`${TEST_ORIGIN}/api/admin/session/get`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: TEST_ORIGIN,
        "sec-fetch-site": "same-origin",
        cookie: browser.cookie(),
      },
      body: JSON.stringify({ json: null }),
    }),
  );

const createClock = () => {
  let now = TEST_NOW;

  return {
    clock: { now: () => now },
    travel: (ms: number): void => {
      now = at(ms);
    },
  };
};

describe("ログインしたセッション", () => {
  test("登録用 URL で登録すると、使わないまま7日で切れるセッションが始まること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    expect(await server.client.admin.session.get()).toEqual({
      expiresAt: at(7 * DAY).toISOString(),
    });
  });

  test("1時間たってから使うと、期限を延ばし、__Host- の Cookie を書き直すこと", async () => {
    const { clock, travel } = createClock();
    await using server = await createTestClient({ clock });

    await signInAsAdmin(server);
    travel(HOUR - 1);

    expect(
      (await getSessionRaw(server, server)).headers.getSetCookie(),
    ).toEqual([]);

    travel(2 * HOUR);

    const response = await getSessionRaw(server, server);
    const [setCookie = ""] = response.headers.getSetCookie();

    expect(await response.json()).toEqual({
      json: { expiresAt: at(2 * HOUR + 7 * DAY).toISOString() },
    });
    expect(setCookie).toStartWith(
      `__Host-analemma_session=${server.cookie().split("=")[1]}`,
    );
    expect(setCookie.split("; ").slice(1).toSorted()).toEqual(
      [
        "HttpOnly",
        "Max-Age=604800",
        "Path=/",
        "SameSite=Strict",
        "Secure",
      ].toSorted(),
    );
  });

  test("同じ origin でないと示す GET では、期限を延ばさないこと", async () => {
    const { clock, travel } = createClock();
    await using server = await createTestClient({ clock });

    await signInAsAdmin(server);
    travel(2 * HOUR);

    const get = async (site: string): Promise<Response> =>
      server.app.fetch(
        new Request(`${TEST_ORIGIN}/api/admin/session/get`, {
          headers: { cookie: server.cookie(), "sec-fetch-site": site },
        }),
      );
    const sameSite = await get("same-site");

    expect(sameSite.status).toBe(403);
    expect(sameSite.headers.getSetCookie()).toEqual([]);

    const sameOrigin = await get("same-origin");

    expect(sameOrigin.status).toBe(200);
    expect(sameOrigin.headers.getSetCookie()).toHaveLength(1);
  });

  test("使わないまま7日たつと、401 にして Cookie を消させること", async () => {
    const { clock, travel } = createClock();
    await using server = await createTestClient({ clock });

    await signInAsAdmin(server);
    travel(7 * DAY - SECOND);

    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      SUCCEEDED,
    );

    travel(7 * DAY - SECOND + 7 * DAY);

    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      "UNAUTHORIZED",
    );
    expect(server.cookie()).toBe("");
  });

  test("毎日使っても、ログインから30日で切れること", async () => {
    const { clock, travel } = createClock();
    await using server = await createTestClient({ clock });

    await signInAsAdmin(server);

    for (let day = 1; day < 30; day += 1) {
      travel(day * DAY);

      expect(await catchErrorCode(server.client.admin.session.get())).toBe(
        SUCCEEDED,
      );
    }

    expect(await server.client.admin.session.get()).toEqual({
      expiresAt: at(30 * DAY).toISOString(),
    });

    travel(30 * DAY);

    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      "UNAUTHORIZED",
    );
  });
});

describe("ログアウト", () => {
  test("ログアウトすると、そのセッションを終えて Cookie を消させること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const token = server.cookie();

    await server.client.admin.session.logOut();

    expect(server.cookie()).toBe("");
    expect(
      await catchErrorCode(
        server.openBrowser(token).client.admin.session.get(),
      ),
    ).toBe("UNAUTHORIZED");
    expect(server.logs.map((entry) => entry.message)).toContain(
      "ログアウトした",
    );
  });

  test("同じブラウザでログインし直すと、前のセッションを終えること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const before = server.cookie();

    await logInWithPasskey(server, passkey);

    expect(server.cookie()).not.toBe(before);
    expect(
      await catchErrorCode(
        server.openBrowser(before).client.admin.session.get(),
      ),
    ).toBe("UNAUTHORIZED");
    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });
});

describe("すべてのセッションからのログアウト", () => {
  test("今のセッションも含めて、すべてのセッションからログアウトし、Cookie を消させること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const laptop = server.openBrowser();
    const phone = server.openBrowser();

    await logInWithPasskey(laptop, passkey);
    await logInWithPasskey(phone, passkey);

    const token = server.cookie();

    expect(await server.client.admin.session.logOutAll()).toEqual({
      loggedOut: 3,
    });
    expect(server.cookie()).toBe("");

    for (const browser of [laptop, phone, server.openBrowser(token)]) {
      expect(await catchErrorCode(browser.client.admin.session.get())).toBe(
        "UNAUTHORIZED",
      );
    }

    expect(server.logs.map((entry) => entry.message)).toContain(
      "すべてのセッションからログアウトした",
    );
  });

  test("ログアウトした後も、パスキーでログインし直せること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    await server.client.admin.session.logOutAll();
    await logInWithPasskey(server, passkey);

    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });
});

test("セッションは新しい10個までにし、ログインが増えたら古いものから終えること", async () => {
  const { clock, travel } = createClock();
  await using server = await createTestClient({ clock });
  const { passkey } = await signInAsAdmin(server);
  const browsers: TestBrowser[] = [];

  for (let index = 1; index <= 10; index += 1) {
    const browser = server.openBrowser();

    travel(index * SECOND);
    await logInWithPasskey(browser, passkey);
    browsers.push(browser);
  }

  expect(await catchErrorCode(server.client.admin.session.get())).toBe(
    "UNAUTHORIZED",
  );

  for (const browser of browsers) {
    expect(await catchErrorCode(browser.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  }
});

test("別々のパスキーで同時にログインしても、セッションは10個を超えないこと", async () => {
  await using server = await createTestClient();
  const { passkey } = await signInAsAdmin(server);
  const passkeys = [passkey];

  for (let index = 0; index < 4; index += 1) {
    passkeys.push(
      await addTestPasskey(server, {
        name: `パスキー ${String(index)}`,
        current: passkey,
      }),
    );
  }

  const browsers = [
    server,
    ...Array.from({ length: 13 }, () => server.openBrowser()),
  ];

  await Promise.all(
    browsers.slice(1, 9).map(async (browser) => {
      await logInWithPasskey(browser, passkey);
    }),
  );
  await Promise.all(
    browsers.slice(9).map(async (browser, index) => {
      await logInWithPasskey(browser, passkeys[index % passkeys.length]!);
    }),
  );

  const results = await Promise.all(
    browsers.map(async (browser) =>
      catchErrorCode(browser.client.admin.session.get()),
    ),
  );

  expect(results.filter((result) => result === SUCCEEDED)).toHaveLength(10);
});
