import { describe, expect, test } from "bun:test";

import { createAuthGate, gateAdminRequests } from "../create-auth-gate";

const tick = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe("createAuthGate", () => {
  test("ログインの最中の管理用 API は、ログインが終わってから送る", async () => {
    const gate = createAuthGate();
    const events: string[] = [];
    const login = Promise.withResolvers<undefined>();
    const running = gate.authenticate(async () => {
      events.push("ログインの開始");
      await login.promise;
      events.push("ログインの終わり");
    });

    await tick();

    const admin = gate.sendAdmin(() => {
      events.push("管理用 API");

      return Promise.resolve();
    });

    await tick();
    login.resolve(undefined);
    await Promise.all([running, admin]);

    expect(events).toEqual([
      "ログインの開始",
      "ログインの終わり",
      "管理用 API",
    ]);
  });

  test("送っている管理用 API が終わってから、ログインを始める", async () => {
    const gate = createAuthGate();
    const events: string[] = [];
    const response = Promise.withResolvers<undefined>();
    const admin = gate.sendAdmin(async () => {
      events.push("管理用 API の送信");
      await response.promise;
      events.push("管理用 API の応答");
    });
    const running = gate.authenticate(() => {
      events.push("ログインの開始");

      return Promise.resolve();
    });

    await tick();
    response.resolve(undefined);
    await Promise.all([admin, running]);

    expect(events).toEqual([
      "管理用 API の送信",
      "管理用 API の応答",
      "ログインの開始",
    ]);
  });

  test("ログインが失敗しても、gate を開ける", async () => {
    const gate = createAuthGate();

    expect(
      gate.authenticate(() => Promise.reject(new Error("失敗"))),
    ).rejects.toThrow("失敗");
    expect(await gate.sendAdmin(() => Promise.resolve("届いた"))).toBe(
      "届いた",
    );
  });
});

describe("gateAdminRequests", () => {
  test("管理用 API だけを gate に通し、認証用 API はそのまま送る", async () => {
    const gate = createAuthGate();
    const sent: string[] = [];
    const fetch = gateAdminRequests(gate, (request) => {
      sent.push(new URL(request.url).pathname);

      return Promise.resolve(new Response());
    });
    const login = Promise.withResolvers<undefined>();
    const running = gate.authenticate(async () => login.promise);

    await tick();
    void fetch(new Request("http://localhost/api/admin/session/get"), {});
    await fetch(new Request("http://localhost/api/auth/login/verify"), {});

    expect(sent).toEqual(["/api/auth/login/verify"]);

    login.resolve(undefined);
    await running;
    await tick();

    expect(sent).toEqual(["/api/auth/login/verify", "/api/admin/session/get"]);
  });
});
