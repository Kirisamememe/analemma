import { ORPCError } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createFakeApi } from "../create-fake-api";

describe("createFakeApi", () => {
  test("決めた出力を、client の戻り値として返し、入力を受け取る", async () => {
    let received: unknown;
    const { api, calls } = createFakeApi({
      "auth/enrollment/options": (input) => {
        received = input;

        return { output: { challenge: "AQID" } };
      },
    });

    const output: unknown = await api.auth.enrollment.options({
      token: "abc",
    });

    expect(output).toEqual({ challenge: "AQID" });
    expect(received).toEqual({ token: "abc" });
    expect(calls).toEqual(["auth/enrollment/options"]);
  });

  test("決めた失敗を、contract に定義した失敗として throw する", async () => {
    const { api } = createFakeApi({
      "admin/session/get": () => ({ error: "UNAUTHORIZED", status: 401 }),
    });
    const failure: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ORPCError);
    expect(failure).toMatchObject({ code: "UNAUTHORIZED", defined: true });
  });

  test("決めていない procedure は NOT_FOUND にする", async () => {
    const { api } = createFakeApi({});
    const failure: unknown = await api.admin.session
      .logOut()
      .catch((error: unknown) => error);

    expect(failure).toMatchObject({ code: "NOT_FOUND" });
  });
});
