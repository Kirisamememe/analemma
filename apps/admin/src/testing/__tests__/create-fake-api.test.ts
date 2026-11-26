import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createFakeApi, type FakeOutput } from "@/testing/create-fake-api";

const ENROLLMENT_OPTIONS: FakeOutput<"auth/enrollment/options"> = {
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
};

describe("createFakeApi", () => {
  test("決めた出力を、client の戻り値として返し、入力を受け取る", async () => {
    let received: unknown;

    const { api, calls } = createFakeApi({
      "auth/enrollment/options": (input) => {
        received = input;

        return { output: ENROLLMENT_OPTIONS };
      },
    });

    const output: unknown = await api.auth.enrollment.options({
      token: "abc",
    });

    expect(output).toEqual(ENROLLMENT_OPTIONS);
    expect(received).toEqual({ token: "abc" });
    expect(calls).toEqual(["auth/enrollment/options"]);
  });

  test("決めた失敗を、contract に定義した失敗として throw する", async () => {
    const { api } = createFakeApi({
      "admin/session/get": () => ({ error: "UNAUTHORIZED" }),
    });

    const failure: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ORPCError);
    expect(failure).toMatchObject({ code: "UNAUTHORIZED", defined: true });
  });

  test("contract と異なる出力は型の誤りにする", () => {
    const routes = {
      // @ts-expect-error -- expiresAt を返していない
      "admin/session/get": () => ({ output: {} }),
    } satisfies Parameters<typeof createFakeApi>[0];

    expect(routes["admin/session/get"]()).toEqual({ output: {} });
  });

  test("contract に定義していない失敗は defined が false になる", async () => {
    const { api } = createFakeApi({
      "admin/session/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    });

    const failure: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      defined: false,
      status: 500,
    });
  });

  test("contract のスキーマに合わない入力は handler に渡さない", async () => {
    let received = false;

    const { api } = createFakeApi({
      "auth/enrollment/options": () => {
        received = true;

        return { output: ENROLLMENT_OPTIONS };
      },
    });

    const failure: unknown = await api.auth.enrollment
      .options({ token: "" })
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "BAD_REQUEST",
      defined: false,
      status: 400,
    });
    expect(received).toBe(false);
  });

  test("決めていない procedure は NOT_FOUND にする", async () => {
    const { api, calls, fetch } = createFakeApi({});

    const failure: unknown = await api.admin.session
      .logOut()
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({ code: "NOT_FOUND" });
    expect(calls).toEqual(["admin/session/logOut"]);

    const response = await fetch(
      new Request("http://localhost:5173/api/admin/session/logOut"),
      {},
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toMatch(/^text\/plain/v);
  });
});

test("写真の進み具合を作り物の送信から通知し、ほかの procedure では通知しない", async () => {
  const progress: number[] = [];

  const { api } = createFakeApi({}, (report) => {
    report(0.42);
  });

  const context = {
    onUploadProgress: (fraction: number) => progress.push(fraction),
  };

  const photo = new File(["photo"], "lake.jpg", { type: "image/jpeg" });

  expect(
    await api.admin.images
      .upload({ photo }, { context })
      .catch((error: unknown) => error),
  ).toMatchObject({ code: "NOT_FOUND" });
  expect(progress).toEqual([0.42]);
  expect(
    await api.admin.session
      .get(undefined, { context })
      .catch((error: unknown) => error),
  ).toMatchObject({ code: "NOT_FOUND" });
  expect(progress).toEqual([0.42]);
});
