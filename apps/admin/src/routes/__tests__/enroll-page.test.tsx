import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { Authenticator } from "../../features/auth/webauthn/create-authenticator";
import type { FakeReply, FakeRoutes } from "../../testing/create-fake-api";
import { renderApp } from "../../testing/render-app";

afterEach(cleanup);

const CREDENTIAL = {
  id: "credential-id",
  type: "public-key" as const,
  response: {
    clientDataJSON: "AQ",
    attestationObject: "Ag",
    transports: ["internal"],
  },
};

const registering = (
  answer: Awaited<ReturnType<Authenticator["register"]>>,
): Authenticator => ({
  authenticate: () => Promise.resolve({ _tag: "Cancelled" }),
  register: () => Promise.resolve(answer),
});

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

/** 作り物の server と、server が受け取った登録。 */
type EnrollmentServer = {
  /** 作り物の server の応答。 */
  readonly routes: FakeRoutes;
  /** server が受け取った登録の入力。 */
  readonly registered: () => unknown;
};

const serverWith = (register: FakeReply): EnrollmentServer => {
  let registered: unknown;

  return {
    routes: {
      "admin/session/get": () =>
        registered === undefined || !("output" in register)
          ? { error: "UNAUTHORIZED", status: 401 }
          : EXPIRY,
      "auth/enrollment/options": () => ({
        output: {
          challenge: "AQID",
          rp: { id: "localhost", name: "Analemma" },
          user: { id: "BAU", name: "admin", displayName: "管理者" },
          pubKeyCredParams: [{ type: "public-key", alg: -8 }],
          excludeCredentials: [],
          authenticatorSelection: {
            residentKey: "required",
            requireResidentKey: true,
            userVerification: "required",
          },
          attestation: "none",
          timeout: 300_000,
        },
      }),
      "auth/enrollment/register": (input) => {
        registered = input;

        return register;
      },
    },
    registered: () => registered,
  };
};

const submitName = async (name: string): Promise<void> => {
  await userEvent.type(
    await screen.findByRole("textbox", { name: "パスキーの名前" }),
    name,
  );
  await userEvent.click(screen.getByRole("button", { name: "パスキーを登録" }));
};

describe("EnrollPage", () => {
  test("名前を付けてパスキーを登録すると、ログインしてホームに移り、履歴から登録用 URL を消す", async () => {
    const server = serverWith(EXPIRY);
    const { history } = renderApp({
      path: "/enroll#abc.def",
      routes: server.routes,
      authenticator: registering({ _tag: "Answered", credential: CREDENTIAL }),
    });

    await submitName("MacBook");

    expect(
      await screen.findByRole("heading", { name: "Stilus" }),
    ).toBeDefined();
    expect(server.registered()).toEqual({
      token: "abc.def",
      name: "MacBook",
      credential: CREDENTIAL,
    });
    expect(history.location.pathname).toBe("/");
    expect(history.length).toBe(1);
  });

  test("登録用 URL に token が無ければ、そのことを知らせ、フォームを出さない", async () => {
    renderApp({ path: "/enroll", routes: serverWith(EXPIRY).routes });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "登録用 URL が不完全です。サーバーのコマンドで発行し直してください。",
    );
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  test("使えなくなった登録用 URL なら、出し直すよう知らせる", async () => {
    renderApp({
      path: "/enroll#abc.def",
      routes: serverWith({ error: "INVALID_ENROLLMENT", status: 403 }).routes,
      authenticator: registering({ _tag: "Answered", credential: CREDENTIAL }),
    });

    await submitName("MacBook");

    expect((await screen.findByRole("alert")).textContent).toContain(
      "この登録用 URL は使えません。",
    );
  });

  test("登録済みの認証器なら、ログイン画面へのリンクを出す", async () => {
    renderApp({
      path: "/enroll#abc.def",
      routes: serverWith(EXPIRY).routes,
      authenticator: registering({ _tag: "AlreadyRegistered" }),
    });

    await submitName("MacBook");

    expect(
      await screen.findByRole("link", { name: "ログイン画面へ" }),
    ).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain(
      "この認証器には、この管理画面のパスキーがもうあります。",
    );
  });

  test("開いたら、token を覚えて、URL と履歴から token を消す", async () => {
    const server = serverWith(EXPIRY);
    const { history } = renderApp({
      path: "/enroll#abc.def",
      routes: server.routes,
      authenticator: registering({ _tag: "Answered", credential: CREDENTIAL }),
    });

    await screen.findByRole("textbox", { name: "パスキーの名前" });

    expect(history.location.hash).toBe("");
    expect(history.length).toBe(1);

    await submitName("MacBook");
    await screen.findByRole("heading", { name: "Stilus" });

    expect(server.registered()).toMatchObject({ token: "abc.def" });
  });

  test("空白だけの名前は、パスキーを作る前に、入力欄で知らせる", async () => {
    const server = serverWith(EXPIRY);
    const { calls } = renderApp({
      path: "/enroll#abc.def",
      routes: server.routes,
      authenticator: registering({ _tag: "Answered", credential: CREDENTIAL }),
    });

    await submitName("   ");

    expect(
      await screen.findByRole("textbox", {
        name: "パスキーの名前",
        description: /1〜64文字で、改行などを使わずに付けてください。/v,
      }),
    ).toBeDefined();
    expect(calls).not.toContain("auth/enrollment/options");
  });

  test("開いたまま新しい登録用 URL を開くと、前の知らせを消し、新しい token で登録する", async () => {
    const server = serverWith(EXPIRY);
    const register = server.routes["auth/enrollment/register"]!;
    const { history } = renderApp({
      path: "/enroll#old.token",
      routes: {
        ...server.routes,
        "auth/enrollment/register": async (input) =>
          typeof input === "object" &&
          input !== null &&
          "token" in input &&
          input.token === "old.token"
            ? { error: "INVALID_ENROLLMENT", status: 403 }
            : register(input),
      },
      authenticator: registering({ _tag: "Answered", credential: CREDENTIAL }),
    });

    await submitName("MacBook");
    await screen.findByRole("alert");
    history.push("/enroll#new.token");
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(history.location.hash).toBe("");

    await userEvent.click(
      screen.getByRole("button", { name: "パスキーを登録" }),
    );
    await screen.findByRole("heading", { name: "Stilus" });

    expect(server.registered()).toMatchObject({ token: "new.token" });
  });
});
