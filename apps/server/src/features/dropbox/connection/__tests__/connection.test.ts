import { describe, expect, test } from "bun:test";

import {
  type ContractOutputs,
  DROPBOX_REDIRECT_PATH,
} from "@analemma/contract";

import {
  catchErrorCode,
  connectTestDropbox,
  createTestClient,
  logInWithPasskey,
  signInAsAdmin,
  TEST_DROPBOX_ACCOUNT,
  TEST_DROPBOX_APP,
  TEST_NOW,
  TEST_ORIGIN,
} from "@/test-client";

const TEN_MINUTES_MS = 10 * 60 * 1000;

describe("Dropbox のアプリの設定が無い server", () => {
  test("設定が無いことを返し、認可を始めないこと", async () => {
    await using server = await createTestClient({ withoutDropbox: true });
    await signInAsAdmin(server);

    expect(await server.client.admin.dropbox.get()).toEqual({
      status: "unconfigured",
    });
    expect(await catchErrorCode(server.client.admin.dropbox.authorize())).toBe(
      "NOT_CONFIGURED",
    );
    expect(
      await catchErrorCode(
        server.client.admin.dropbox.connect({ code: "c", state: "s" }),
      ),
    ).toBe("NOT_CONFIGURED");
  });
});

describe("つなぐ", () => {
  test("App folder を読むだけの範囲で、refresh token を求める認可の画面を開くこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const { url } = await server.client.admin.dropbox.authorize();
    const authorize = new URL(url);

    expect(authorize.origin + authorize.pathname).toBe(
      "https://www.dropbox.com/oauth2/authorize",
    );
    expect(Object.fromEntries(authorize.searchParams)).toMatchObject({
      client_id: TEST_DROPBOX_APP.appKey,
      response_type: "code",
      redirect_uri: `${TEST_ORIGIN}${DROPBOX_REDIRECT_PATH}`,
      token_access_type: "offline",
      scope: "account_info.read files.metadata.read files.content.read",
    });
    expect(authorize.searchParams.get("state")).toMatch(/^[\w\-]{43}$/v);
  });

  test("戻った code で、アカウントにつなぐこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const connected: ContractOutputs["admin"]["dropbox"]["get"] = {
      status: "connected",
      accountName: TEST_DROPBOX_ACCOUNT.name.display_name,
      accountEmail: TEST_DROPBOX_ACCOUNT.email,
      connectedAt: TEST_NOW.toISOString(),
    };

    expect(await server.client.admin.dropbox.get()).toEqual({
      status: "disconnected",
    });
    expect(await connectTestDropbox(server)).toEqual(connected);
    expect(await server.client.admin.dropbox.get()).toEqual(connected);
    expect(await catchErrorCode(server.client.admin.dropbox.authorize())).toBe(
      "ALREADY_CONNECTED",
    );
  });

  test("知らない state・別のセッションの state・使った state は断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const other = server.openBrowser();

    await logInWithPasskey(other, passkey);

    const { url } = await server.client.admin.dropbox.authorize();
    const { code, state } = server.dropbox.approve(url);
    const { connect } = server.client.admin.dropbox;

    expect(await catchErrorCode(connect({ code, state: "unknown" }))).toBe(
      "AUTHORIZATION_EXPIRED",
    );
    expect(
      await catchErrorCode(other.client.admin.dropbox.connect({ code, state })),
    ).toBe("AUTHORIZATION_EXPIRED");
    expect(await catchErrorCode(connect({ code, state }))).toBe(
      "AUTHORIZATION_EXPIRED",
    );
  });

  test("認可の画面を開いてから10分を過ぎて戻った state は断ること", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });
    await signInAsAdmin(server);

    const { url } = await server.client.admin.dropbox.authorize();
    const { code, state } = server.dropbox.approve(url);

    now = new Date(TEST_NOW.getTime() + TEN_MINUTES_MS);

    expect(
      await catchErrorCode(
        server.client.admin.dropbox.connect({ code, state }),
      ),
    ).toBe("AUTHORIZATION_EXPIRED");
  });

  test("Dropbox が code を断ったら、つながないこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const { url } = await server.client.admin.dropbox.authorize();
    const { state } = server.dropbox.approve(url);

    expect(
      await catchErrorCode(
        server.client.admin.dropbox.connect({ code: "wrong", state }),
      ),
    ).toBe("AUTHORIZATION_REJECTED");
    expect(await server.client.admin.dropbox.get()).toEqual({
      status: "disconnected",
    });
  });
});

describe("切る", () => {
  test("Dropbox に預けた認可を取り消してから、接続を切ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    await connectTestDropbox(server);

    await server.client.admin.dropbox.disconnect();

    expect(server.dropbox.requests).toContain("/2/auth/token/revoke");
    expect(await server.client.admin.dropbox.get()).toEqual({
      status: "disconnected",
    });
    expect(await connectTestDropbox(server)).toMatchObject({
      status: "connected",
    });
  });

  test("利用者が Dropbox の側で切った後も、接続を切れること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    await connectTestDropbox(server);

    server.dropbox.unlink();
    await server.client.admin.dropbox.disconnect();

    expect(server.dropbox.requests).not.toContain("/2/auth/token/revoke");
    expect(await server.client.admin.dropbox.get()).toEqual({
      status: "disconnected",
    });
  });
});
