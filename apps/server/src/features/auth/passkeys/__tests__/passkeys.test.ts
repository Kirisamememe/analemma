import { describe, expect, test } from "bun:test";

import { createFakeAuthenticator } from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import {
  addTestPasskey,
  passkeyIdOf as idOf,
  answerAuthentication,
  answerReauthentication,
  answerRegistration,
  SUCCEEDED,
  catchErrorCode,
  TEST_NOW,
  createTestClient,
  logInWithPasskey,
  signInAsAdmin,
} from "@/test-client";

describe("パスキーの一覧", () => {
  test("名前・日時・同期されているかだけを返し、公開鍵などは返さないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const { passkeys } = await server.client.admin.passkeys.list();

    expect(passkeys).toEqual([
      {
        id: idOf(passkey),
        name: "最初のパスキー",
        createdAt: TEST_NOW.toISOString(),
        lastUsedAt: TEST_NOW.toISOString(),
        backedUp: true,
      },
    ]);
  });
});

describe("パスキーの追加", () => {
  test("今のパスキーで確かめ直し、登録済みのパスキーを除いた options で、パスキーを足せること", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });
    const { passkey: first } = await signInAsAdmin(server);
    const options = await server.client.admin.passkeys.registrationOptions();

    expect(options.excludeCredentials).toEqual([
      { type: "public-key", id: idOf(first), transports: ["internal"] },
    ]);

    now = new Date(TEST_NOW.getTime() + 60_000);

    const second = await addTestPasskey(server, {
      name: "  2つめ  ",
      current: first,
    });
    const { passkeys } = await server.client.admin.passkeys.list();

    expect(
      passkeys.map(({ id, lastUsedAt, name }) => ({ id, lastUsedAt, name })),
    ).toEqual([
      {
        id: idOf(first),
        lastUsedAt: now.toISOString(),
        name: "最初のパスキー",
      },
      { id: idOf(second), lastUsedAt: now.toISOString(), name: "2つめ" },
    ]);

    const browser = server.openBrowser();

    await logInWithPasskey(browser, second);

    expect(await catchErrorCode(browser.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });

  test("ほかのセッションが求めた登録の challenge では、パスキーを足せないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const other = server.openBrowser();

    await logInWithPasskey(other, passkey);

    expect(
      await catchErrorCode(
        server.client.admin.passkeys.register({
          name: "パスキー",
          credential: await answerRegistration({
            authenticator: await createFakeAuthenticator(),
            options: await other.client.admin.passkeys.registrationOptions(),
          }),
          assertion: await answerReauthentication(server, passkey),
        }),
      ),
    ).toBe("CHALLENGE_EXPIRED");
  });

  test("同じ資格情報をもう一度足そうとすると、DUPLICATE_CREDENTIAL で断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const assertion = await answerReauthentication(server, passkey);

    expect(
      await catchErrorCode(
        server.client.admin.passkeys.register({
          name: "同じもの",
          credential: await answerRegistration({
            authenticator: passkey.authenticator,
            options: await server.client.admin.passkeys.registrationOptions(),
          }),
          assertion,
        }),
      ),
    ).toBe("DUPLICATE_CREDENTIAL");
  });
});

describe("パスキーの名前の変更", () => {
  test("名前を変え、前後の空白を落とすこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    expect(
      await server.client.admin.passkeys.rename({
        id: idOf(passkey),
        name: " 仕事の Mac ",
      }),
    ).toMatchObject({ id: idOf(passkey), name: "仕事の Mac" });
  });

  test("無いパスキーは NOT_FOUND、空・長すぎる・制御文字のある名前は入力の誤りにすること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const rename = async (id: string, name: string): Promise<string> =>
      catchErrorCode(server.client.admin.passkeys.rename({ id, name }));

    expect(await rename("AAAAAAAAAAAAAAAAAAAAAA", "名前")).toBe("NOT_FOUND");
    expect(await rename(idOf(passkey), "   ")).toBe("BAD_REQUEST");
    expect(await rename(idOf(passkey), "あ".repeat(65))).toBe("BAD_REQUEST");
    expect(await rename(idOf(passkey), "a\u0000b")).toBe("BAD_REQUEST");
    expect(await rename(idOf(passkey), "a\nb")).toBe("BAD_REQUEST");
    expect(await rename(idOf(passkey), "あ".repeat(64))).toBe(SUCCEEDED);
  });
});

test("資格情報の ID の上限(1366文字)を超える ID は、名前の変更でも削除でも入力の誤りにすること", async () => {
  await using server = await createTestClient();
  const { passkey } = await signInAsAdmin(server);
  const rename = async (id: string): Promise<string> =>
    catchErrorCode(server.client.admin.passkeys.rename({ id, name: "名前" }));
  const remove = async (id: string): Promise<string> =>
    catchErrorCode(
      server.client.admin.passkeys.delete({
        id,
        assertion: await answerReauthentication(server, passkey),
      }),
    );

  expect(await rename("A".repeat(1366))).toBe("NOT_FOUND");
  expect(await rename("A".repeat(1367))).toBe("BAD_REQUEST");
  expect(await remove("A".repeat(1366))).toBe("NOT_FOUND");
  expect(await remove("A".repeat(1367))).toBe("BAD_REQUEST");
});

describe("パスキーの削除", () => {
  test("今のパスキーで確かめ直しても、最後の1つは消せないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    expect(
      await catchErrorCode(
        server.client.admin.passkeys.delete({
          id: idOf(passkey),
          assertion: await answerReauthentication(server, passkey),
        }),
      ),
    ).toBe("LAST_PASSKEY");
    expect((await server.client.admin.passkeys.list()).passkeys).toHaveLength(
      1,
    );
  });

  test("2つあれば、確かめ直したパスキー自身も消せ、消したパスキーではログインできないこと", async () => {
    await using server = await createTestClient();
    const { passkey: first } = await signInAsAdmin(server);
    const second = await addTestPasskey(server, {
      name: "2つめ",
      current: first,
    });

    await server.client.admin.passkeys.delete({
      id: idOf(first),
      assertion: await answerReauthentication(server, first),
    });

    expect(
      (await server.client.admin.passkeys.list()).passkeys.map(({ id }) => id),
    ).toEqual([idOf(second)]);
    expect(
      await catchErrorCode(
        server.client.auth.login.verify(
          await answerAuthentication({
            passkey: first,
            options: await server.client.auth.login.options(),
          }),
        ),
      ),
    ).toBe("UNKNOWN_CREDENTIAL");
    expect(
      await catchErrorCode(
        server.client.admin.passkeys.delete({
          id: idOf(second),
          assertion: await answerReauthentication(server, second),
        }),
      ),
    ).toBe("LAST_PASSKEY");
    expect(server.logs.map((entry) => entry.message)).toContain(
      "パスキーを消した",
    );
  });

  test("パスキーを消すと、今のセッションのほかは、すべてログアウトさせること", async () => {
    await using server = await createTestClient();
    const { passkey: first } = await signInAsAdmin(server);
    const second = await addTestPasskey(server, {
      name: "2つめ",
      current: first,
    });
    const lost = server.openBrowser();
    const other = server.openBrowser();

    await logInWithPasskey(lost, first);
    await logInWithPasskey(other, second);
    await server.client.admin.passkeys.delete({
      id: idOf(first),
      assertion: await answerReauthentication(server, second),
    });

    expect(await catchErrorCode(lost.client.admin.session.get())).toBe(
      "UNAUTHORIZED",
    );
    expect(await catchErrorCode(other.client.admin.session.get())).toBe(
      "UNAUTHORIZED",
    );
    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });

  test("消せなかったときは、ほかのセッションを残すこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const other = server.openBrowser();

    await logInWithPasskey(other, passkey);

    expect(
      await catchErrorCode(
        server.client.admin.passkeys.delete({
          id: idOf(passkey),
          assertion: await answerReauthentication(server, passkey),
        }),
      ),
    ).toBe("LAST_PASSKEY");
    expect(await catchErrorCode(other.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });

  test("無いパスキーを NOT_FOUND で断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    expect(
      await catchErrorCode(
        server.client.admin.passkeys.delete({
          id: "AAAAAAAAAAAAAAAAAAAAAA",
          assertion: await answerReauthentication(server, passkey),
        }),
      ),
    ).toBe("NOT_FOUND");
  });

  test("2つを同時に消そうとしても、ちょうど1つだけ消えること", async () => {
    await using server = await createTestClient();
    const { passkey: first } = await signInAsAdmin(server);
    const second = await addTestPasskey(server, {
      name: "2つめ",
      current: first,
    });
    const assertions = [
      await answerReauthentication(server, first),
      await answerReauthentication(server, first),
    ];
    const results = await Promise.all(
      [first, second].map(async (passkey, index) =>
        catchErrorCode(
          server.client.admin.passkeys.delete({
            id: idOf(passkey),
            assertion: assertions[index]!,
          }),
        ),
      ),
    );

    expect(results.filter((result) => result === SUCCEEDED)).toHaveLength(1);
    expect((await server.client.admin.passkeys.list()).passkeys).toHaveLength(
      1,
    );
  });
});

test("パスキーを消すのと同時のログインは、500 にならず、ログインか UNKNOWN_CREDENTIAL になること", async () => {
  for (let round = 0; round < 3; round += 1) {
    await using server = await createTestClient();
    const { passkey: first } = await signInAsAdmin(server);
    const second = await addTestPasskey(server, {
      name: "2つめ",
      current: first,
    });
    const browser = server.openBrowser();
    const credential = await answerAuthentication({
      passkey: first,
      options: await browser.client.auth.login.options(),
    });
    const assertion = await answerReauthentication(server, second);
    const [login, deletion] = await Promise.all([
      catchErrorCode(browser.client.auth.login.verify(credential)),
      catchErrorCode(
        server.client.admin.passkeys.delete({ id: idOf(first), assertion }),
      ),
    ]);

    expect([SUCCEEDED, "UNKNOWN_CREDENTIAL"]).toContain(login);
    expect(deletion).toBe(SUCCEEDED);
  }
});
