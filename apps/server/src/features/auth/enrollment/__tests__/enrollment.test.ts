import { describe, expect, test } from "bun:test";

import { COSE_ALGORITHM } from "@/features/auth/webauthn/cose-key/cose-algorithm";
import {
  type FakeAuthenticator,
  createFakeAuthenticator,
} from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import {
  answerRegistration,
  SUCCEEDED,
  catchErrorCode,
  TEST_NOW,
  TEST_ORIGIN,
  TEST_RP_ID,
  type TestClient,
  createTestClient,
  logInWithPasskey,
  signInAsAdmin,
} from "@/test-client";

const MINUTE = 60 * 1000;

const issueToken = async (server: TestClient): Promise<string> =>
  new URL(await server.issueEnrollmentUrl()).hash.slice(1);

/** 登録に使う token と認証器。 */
type Enrollment = {
  /** 登録用 URL の token。 */
  readonly token: string;
  /** 応答を作る認証器。 */
  readonly authenticator?: FakeAuthenticator;
};

const register = async (
  server: TestClient,
  { authenticator, token }: Enrollment,
): Promise<string> => {
  const options = await server.client.auth.enrollment.options({ token });

  return catchErrorCode(
    server.client.auth.enrollment.register({
      token,
      name: "新しいパスキー",
      credential: await answerRegistration({
        authenticator: authenticator ?? (await createFakeAuthenticator()),
        options,
      }),
    }),
  );
};

describe("登録用 URL", () => {
  test("管理画面の origin の /enroll に、# の後ろの token を付けた URL であること", async () => {
    await using server = await createTestClient();

    expect(await server.issueEnrollmentUrl()).toMatch(
      /^https:\/\/analemma\.test\/enroll#[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}$/v,
    );
  });

  test("token で、管理者のパスキーの登録の options を返すこと", async () => {
    await using server = await createTestClient();
    const options = await server.client.auth.enrollment.options({
      token: await issueToken(server),
    });

    expect(options).toEqual({
      challenge: options.challenge,
      rp: { id: TEST_RP_ID, name: "Analemma" },
      user: { id: options.user.id, name: "admin", displayName: "管理者" },
      pubKeyCredParams: [
        { type: "public-key", alg: COSE_ALGORITHM.EdDSA },
        { type: "public-key", alg: COSE_ALGORITHM.ES256 },
        { type: "public-key", alg: COSE_ALGORITHM.RS256 },
      ],
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: "required",
        requireResidentKey: true,
        userVerification: "required",
      },
      attestation: "none",
      timeout: 5 * MINUTE,
    });
    expect(
      Uint8Array.fromBase64(options.user.id, { alphabet: "base64url" }),
    ).toHaveLength(16);
  });

  test("登録すると、そのままログインし、名前の付いたパスキーが残ること", async () => {
    await using server = await createTestClient();

    expect(await register(server, { token: await issueToken(server) })).toBe(
      SUCCEEDED,
    );
    const { passkeys } = await server.client.admin.passkeys.list();

    expect(passkeys.map(({ id: _, ...rest }) => rest)).toEqual([
      {
        name: "新しいパスキー",
        createdAt: TEST_NOW.toISOString(),
        lastUsedAt: TEST_NOW.toISOString(),
        backedUp: true,
      },
    ]);
  });

  test("1回使った token は、もう使えないこと", async () => {
    await using server = await createTestClient();
    const token = await issueToken(server);

    expect(await register(server, { token })).toBe(SUCCEEDED);
    expect(
      await catchErrorCode(server.client.auth.enrollment.options({ token })),
    ).toBe("INVALID_ENROLLMENT");
  });

  test("options を取った後に使われた token では、登録できないこと", async () => {
    await using server = await createTestClient();
    const token = await issueToken(server);
    const options = await server.client.auth.enrollment.options({ token });

    expect(await register(server, { token })).toBe(SUCCEEDED);
    expect(
      await catchErrorCode(
        server.client.auth.enrollment.register({
          token,
          name: "2つめ",
          credential: await answerRegistration({
            authenticator: await createFakeAuthenticator(),
            options,
          }),
        }),
      ),
    ).toBe("INVALID_ENROLLMENT");
  });

  test("10分たった token は使えないこと", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });
    const token = await issueToken(server);

    now = new Date(TEST_NOW.getTime() + 10 * MINUTE - 1);

    expect(
      await catchErrorCode(server.client.auth.enrollment.options({ token })),
    ).toBe(SUCCEEDED);

    now = new Date(TEST_NOW.getTime() + 10 * MINUTE);

    expect(
      await catchErrorCode(server.client.auth.enrollment.options({ token })),
    ).toBe("INVALID_ENROLLMENT");
  });

  test("新しい登録用 URL を出すと、前の token は使えなくなること", async () => {
    await using server = await createTestClient();
    const first = await issueToken(server);
    const second = await issueToken(server);

    expect(
      await catchErrorCode(
        server.client.auth.enrollment.options({ token: first }),
      ),
    ).toBe("INVALID_ENROLLMENT");
    expect(await register(server, { token: second })).toBe(SUCCEEDED);
  });

  test("登録用 URL を同時に出しても、使えるのは1つだけであること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const tokens = await Promise.all(
      Array.from({ length: 5 }, async () => issueToken(server)),
    );
    const results = await Promise.all(
      tokens.map(async (token) =>
        catchErrorCode(server.client.auth.enrollment.options({ token })),
      ),
    );

    expect(results.filter((result) => result === SUCCEEDED)).toHaveLength(1);
  });

  test.each([
    {
      title: "secret の最後の1文字を変えた",
      change: (token: string) =>
        `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`,
    },
    { title: "形の違う", change: () => "not-a-token" },
  ])("$title token を断ること", async ({ change }) => {
    await using server = await createTestClient();
    const token = await issueToken(server);
    const changed = change(token);

    expect(
      await catchErrorCode(
        server.client.auth.enrollment.options({ token: changed }),
      ),
    ).toBe("INVALID_ENROLLMENT");
    expect(server.logs.map((entry) => entry.message)).toContain(
      "使えない登録用 URL の token を断った",
    );
  });

  test("ログインの challenge では、登録できないこと", async () => {
    await using server = await createTestClient();
    const token = await issueToken(server);
    const options = await server.client.auth.enrollment.options({ token });
    const { challenge } = await server.client.auth.login.options();

    expect(
      await catchErrorCode(
        server.client.auth.enrollment.register({
          token,
          name: "パスキー",
          credential: await answerRegistration({
            authenticator: await createFakeAuthenticator(),
            options: { ...options, challenge },
          }),
        }),
      ),
    ).toBe("CHALLENGE_EXPIRED");
  });

  test("16 バイトより短い資格情報の ID を断り、token は使い切らないこと", async () => {
    await using server = await createTestClient();
    const token = await issueToken(server);

    expect(
      await register(server, {
        token,
        authenticator: await createFakeAuthenticator({
          credentialIdLength: 15,
        }),
      }),
    ).toBe("INVALID_CREDENTIAL");
    expect(await register(server, { token })).toBe(SUCCEEDED);
  });

  test("Origin を偽った応答を断ること", async () => {
    await using server = await createTestClient();
    const token = await issueToken(server);
    const options = await server.client.auth.enrollment.options({ token });

    expect(
      await catchErrorCode(
        server.client.auth.enrollment.register({
          token,
          name: "パスキー",
          credential: await answerRegistration({
            authenticator: await createFakeAuthenticator(),
            options,
            broken: { origin: `${TEST_ORIGIN}.evil.example` },
          }),
        }),
      ),
    ).toBe("INVALID_CREDENTIAL");
  });
});

describe("パスキーを全部失ったときの復旧", () => {
  test("新しい登録用 URL で別のパスキーを登録でき、前のパスキーは options で除くこと", async () => {
    await using server = await createTestClient();
    const { passkey: lost } = await signInAsAdmin(server);
    const phone = server.openBrowser();
    const token = await issueToken(server);
    const options = await phone.client.auth.enrollment.options({ token });
    const authenticator = await createFakeAuthenticator();

    expect(options.excludeCredentials).toEqual([
      {
        type: "public-key",
        id: lost.authenticator.credentialId.toBase64({
          alphabet: "base64url",
          omitPadding: true,
        }),
        transports: ["internal"],
      },
    ]);

    await phone.client.auth.enrollment.register({
      token,
      name: "復旧したパスキー",
      credential: await answerRegistration({ authenticator, options }),
    });

    expect(await catchErrorCode(phone.client.admin.session.get())).toBe(
      SUCCEEDED,
    );

    const another = server.openBrowser();

    await logInWithPasskey(another, {
      authenticator,
      userHandle: options.user.id,
    });

    expect(await catchErrorCode(another.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });

  test("登録用 URL で登録すると、ほかのセッションをすべてログアウトさせること", async () => {
    await using server = await createTestClient();
    const { passkey: lost } = await signInAsAdmin(server);
    const stolen = server.openBrowser();
    const phone = server.openBrowser();
    const token = await issueToken(server);

    await logInWithPasskey(stolen, lost);

    const options = await phone.client.auth.enrollment.options({ token });

    await phone.client.auth.enrollment.register({
      token,
      name: "復旧したパスキー",
      credential: await answerRegistration({
        authenticator: await createFakeAuthenticator(),
        options,
      }),
    });

    expect(await catchErrorCode(server.client.admin.session.get())).toBe(
      "UNAUTHORIZED",
    );
    expect(await catchErrorCode(stolen.client.admin.session.get())).toBe(
      "UNAUTHORIZED",
    );
    expect(await catchErrorCode(phone.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });

  test("登録できなかったときは、ほかのセッションを残すこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const other = server.openBrowser();

    await logInWithPasskey(other, passkey);

    expect(
      await register(server, {
        token: await issueToken(server),
        authenticator: passkey.authenticator,
      }),
    ).toBe("DUPLICATE_CREDENTIAL");
    expect(await catchErrorCode(other.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
  });

  test("登録済みの資格情報をもう一度登録しようとすると、DUPLICATE_CREDENTIAL で断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const token = await issueToken(server);

    expect(
      await register(server, {
        token,
        authenticator: passkey.authenticator,
      }),
    ).toBe("DUPLICATE_CREDENTIAL");
    expect(await register(server, { token })).toBe(SUCCEEDED);
  });
});
