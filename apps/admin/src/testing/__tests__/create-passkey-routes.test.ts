import { describe, expect, test } from "bun:test";

import { createFakeApi } from "../create-fake-api";
import { FAKE_ASSERTION, FAKE_ATTESTATION } from "../create-fake-authenticator";
import { createPasskeyRoutes } from "../create-passkey-routes";

const setUp = (names: readonly string[]) => {
  const server = createPasskeyRoutes(
    names.map((name) => ({ name, backedUp: true })),
  );

  return { server, api: createFakeApi(server.routes).api };
};

describe("createPasskeyRoutes", () => {
  test("再認証の後なら、追加・名前の変更・削除で、一覧が変わる", async () => {
    const { api } = setUp(["MacBook", "iPhone"]);

    await api.admin.session.reauthenticationOptions();
    await api.admin.passkeys.register({
      name: "iPad",
      credential: FAKE_ATTESTATION,
      assertion: FAKE_ASSERTION,
    });
    await api.admin.passkeys.rename({ id: "pk1", name: "Mac" });
    await api.admin.session.reauthenticationOptions();
    await api.admin.passkeys.delete({ id: "pk2", assertion: FAKE_ASSERTION });

    expect(
      (await api.admin.passkeys.list()).passkeys.map(({ id, name }) => [
        id,
        name,
      ]),
    ).toEqual([
      ["pk1", "Mac"],
      ["pk3", "iPad"],
    ]);
  });

  test("1つの再認証で、操作は1回だけ", async () => {
    const { api } = setUp(["MacBook", "iPhone", "iPad"]);

    await api.admin.session.reauthenticationOptions();
    await api.admin.passkeys.delete({ id: "pk2", assertion: FAKE_ASSERTION });

    expect(
      api.admin.passkeys.delete({ id: "pk3", assertion: FAKE_ASSERTION }),
    ).rejects.toMatchObject({ code: "REAUTHENTICATION_FAILED" });
  });

  test("無いパスキーは NOT_FOUND、最後のパスキーは LAST_PASSKEY にする", async () => {
    const { api } = setUp(["MacBook"]);

    await api.admin.session.reauthenticationOptions();

    expect(
      api.admin.passkeys.delete({ id: "pk9", assertion: FAKE_ASSERTION }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await api.admin.session.reauthenticationOptions();

    expect(
      api.admin.passkeys.delete({ id: "pk1", assertion: FAKE_ASSERTION }),
    ).rejects.toMatchObject({ code: "LAST_PASSKEY" });
    expect(
      api.admin.passkeys.rename({ id: "pk9", name: "x" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("すべてのセッションからログアウトしたら、管理用 API は UNAUTHORIZED を返す", async () => {
    const { api } = setUp(["MacBook"]);

    await api.admin.session.logOutAll();

    expect(api.admin.session.get()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("決めた応答を、次の1回だけ返す", async () => {
    const { api, server } = setUp(["MacBook"]);

    server.replyNext("admin/passkeys/list", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    expect(api.admin.passkeys.list()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect((await api.admin.passkeys.list()).passkeys).toHaveLength(1);
  });
});
