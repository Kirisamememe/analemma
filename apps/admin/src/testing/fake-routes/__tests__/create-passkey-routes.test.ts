import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createFakeApi, wrapFakeRoute } from "@/testing/create-fake-api";
import {
  FAKE_ASSERTION,
  FAKE_ATTESTATION,
} from "@/testing/create-fake-authenticator";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";

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
    await api.admin.passkeys.rename({ id: "cGsx", name: "Mac" });
    await api.admin.session.reauthenticationOptions();
    await api.admin.passkeys.delete({ id: "cGsy", assertion: FAKE_ASSERTION });

    expect(
      (await api.admin.passkeys.list()).passkeys.map(({ id, name }) => [
        id,
        name,
      ]),
    ).toEqual([
      ["cGsx", "Mac"],
      ["cGsz", "iPad"],
    ]);
  });

  test("100番目のパスキーも追加・一覧取得・名前の変更ができること", async () => {
    const { api } = setUp(Array.from({ length: 99 }, () => "MacBook"));

    await api.admin.session.reauthenticationOptions();
    const added = await api.admin.passkeys.register({
      name: "iPad",
      credential: FAKE_ATTESTATION,
      assertion: FAKE_ASSERTION,
    });

    expect(
      Uint8Array.fromBase64(added.id, { alphabet: "base64url" }).length,
    ).toBeGreaterThan(0);
    expect((await api.admin.passkeys.list()).passkeys).toHaveLength(100);
    expect(
      await api.admin.passkeys.rename({ id: added.id, name: "iPad Pro" }),
    ).toMatchObject({ id: added.id, name: "iPad Pro" });
  });

  test("1つの再認証で、操作は1回だけ", async () => {
    const { api } = setUp(["MacBook", "iPhone", "iPad"]);

    await api.admin.session.reauthenticationOptions();
    await api.admin.passkeys.delete({ id: "cGsy", assertion: FAKE_ASSERTION });

    expect(
      api.admin.passkeys.delete({ id: "cGsz", assertion: FAKE_ASSERTION }),
    ).rejects.toMatchObject({ code: "REAUTHENTICATION_FAILED" });
  });

  test("無いパスキーは NOT_FOUND、最後のパスキーは LAST_PASSKEY にする", async () => {
    const { api } = setUp(["MacBook"]);

    await api.admin.session.reauthenticationOptions();

    expect(
      api.admin.passkeys.delete({ id: "cGs5", assertion: FAKE_ASSERTION }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await api.admin.session.reauthenticationOptions();

    expect(
      api.admin.passkeys.delete({ id: "cGsx", assertion: FAKE_ASSERTION }),
    ).rejects.toMatchObject({ code: "LAST_PASSKEY" });
    expect(
      api.admin.passkeys.rename({ id: "cGs5", name: "x" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test.each(["logOut", "logOutAll"] as const)(
    "%s でログアウトしたら、管理用 API は UNAUTHORIZED を返す",
    async (procedure) => {
      const { api } = setUp(["MacBook"]);

      await api.admin.session[procedure]();

      const failure: unknown = await api.admin.session
        .get()
        .catch((error: unknown) => error);

      expect(failure).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    },
  );

  test.each(["追加", "削除"])(
    "ログアウトとパスキーの%sが重なり、ログアウトが先に成立したら一覧が変わらないこと",
    async (operation) => {
      const { api, server } = setUp(["MacBook", "iPhone"]);
      const before = server.passkeys();

      await api.admin.session.reauthenticationOptions();
      const logOut = api.admin.session.logOutAll();
      const change =
        operation === "追加"
          ? api.admin.passkeys.register({
              name: "iPad",
              credential: FAKE_ATTESTATION,
              assertion: FAKE_ASSERTION,
            })
          : api.admin.passkeys.delete({
              id: "cGsx",
              assertion: FAKE_ASSERTION,
            });
      const [session, failure] = await Promise.all([
        logOut,
        change.catch((error: unknown) => error),
      ]);

      expect(session).toEqual({ loggedOut: 2 });
      expect(failure).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
      expect(server.passkeys()).toEqual(before);
    },
  );

  test("関数で包んだ一覧でも指定した応答を一度だけ返し、ログアウト後は UNAUTHORIZED を返すこと", async () => {
    const { server } = setUp(["MacBook"]);
    const list = server.routes["admin/passkeys/list"];
    const { api } = createFakeApi({
      ...server.routes,
      "admin/passkeys/list": wrapFakeRoute(list, (input) => list(input)),
    });

    server.replyNext("admin/passkeys/list", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    const next: unknown = await api.admin.passkeys
      .list()
      .catch((error: unknown) => error);

    expect(next).toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect((await api.admin.passkeys.list()).passkeys).toHaveLength(1);

    await api.admin.session.logOutAll();
    const after: unknown = await api.admin.passkeys
      .list()
      .catch((error: unknown) => error);

    expect(after).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });

  test("ログアウトした後は、名前が空でも UNAUTHORIZED を返すこと", async () => {
    const { api } = setUp(["MacBook"]);

    await api.admin.session.logOutAll();

    const failure: unknown = await api.admin.passkeys
      .rename({ id: "cGsx", name: "" })
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });

  test.each(["元の procedure", "応答の関数を包んだ procedure"])(
    "%sにログアウト後の空の名前を2回送ったら、指定した応答を1回だけ返すこと",
    async (mode) => {
      const { server } = setUp(["MacBook"]);
      const rename = server.routes["admin/passkeys/rename"];
      const routes =
        mode === "元の procedure"
          ? server.routes
          : {
              ...server.routes,
              "admin/passkeys/rename": wrapFakeRoute(rename, (input) =>
                rename(input),
              ),
            };
      const { api } = createFakeApi(routes);
      await api.admin.session.logOutAll();

      server.replyNext("admin/passkeys/rename", () => ({ error: "NOT_FOUND" }));
      const input = { id: "cGsx", name: "" };
      const errors = await Promise.all([
        api.admin.passkeys.rename(input).catch((error: unknown) => error),
        api.admin.passkeys.rename(input).catch((error: unknown) => error),
      ]);

      expect(
        errors.find(
          (error) => error instanceof ORPCError && error.code === "NOT_FOUND",
        ),
      ).toMatchObject({ status: 404, defined: true });
      expect(
        errors.find(
          (error) =>
            error instanceof ORPCError && error.code === "UNAUTHORIZED",
        ),
      ).toMatchObject({ status: 401 });
    },
  );

  test("次の1回だけ返す出力も contract で検証すること", async () => {
    const { api, server } = setUp(["MacBook"]);

    server.replyNext("admin/session/get", () => ({
      output: { expiresAt: "invalid" },
    }));
    const failure: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
    });
  });

  test("有効なセッションで名前が空なら BAD_REQUEST を返すこと", async () => {
    const { api } = setUp(["MacBook"]);
    const failure: unknown = await api.admin.passkeys
      .rename({ id: "cGsx", name: "" })
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({ code: "BAD_REQUEST", status: 400 });
  });

  test("処理中の一覧は、次の一覧に指定した応答を使わないこと", async () => {
    const { api, server } = setUp(["MacBook"]);
    const list = server.routes["admin/passkeys/list"];
    const started = Promise.withResolvers<undefined>();
    const resume = Promise.withResolvers<undefined>();

    server.replyNext("admin/passkeys/list", async () => {
      started.resolve(undefined);
      await resume.promise;

      return list(undefined);
    });
    const first = api.admin.passkeys.list().catch((error: unknown) => error);
    await started.promise;

    server.replyNext("admin/passkeys/list", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    resume.resolve(undefined);
    expect(await first).toMatchObject({ passkeys: [{ name: "MacBook" }] });

    const next: unknown = await api.admin.passkeys
      .list()
      .catch((error: unknown) => error);

    expect(next).toMatchObject({ code: "INTERNAL_SERVER_ERROR", status: 500 });
    expect((await api.admin.passkeys.list()).passkeys).toHaveLength(1);
  });
});
