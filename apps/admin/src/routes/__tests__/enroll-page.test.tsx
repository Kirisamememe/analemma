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
      "admin/session/get": () => EXPIRY,
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
      "登録用 URL が欠けています。server のコマンドで出し直してください。",
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

  test("登録済みの認証器なら、ログインの画面へのリンクを出す", async () => {
    renderApp({
      path: "/enroll#abc.def",
      routes: serverWith(EXPIRY).routes,
      authenticator: registering({ _tag: "AlreadyRegistered" }),
    });

    await submitName("MacBook");

    expect(
      await screen.findByRole("link", { name: "ログインの画面へ" }),
    ).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain(
      "この認証器には、この管理画面のパスキーがもうあります。",
    );
  });
});
