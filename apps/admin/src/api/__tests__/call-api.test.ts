import { ORPCError, createORPCClient } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createFakeApi } from "../../testing/create-fake-api";
import { FAKE_ASSERTION } from "../../testing/create-fake-authenticator";
import type { ApiClient, ApiOutputs } from "../api-types";
import { callApi } from "../call-api";

const INPUT = { id: "current-passkey", assertion: FAKE_ASSERTION };

const rejectingApi = (failure: Error): ApiClient => {
  const call = (): Promise<never> => Promise.reject(failure);

  return createORPCClient({ call });
};

describe("callApi", () => {
  test("成功したら、contract の出力を返す", async () => {
    const data = { passkeys: [] };
    const { api } = createFakeApi({
      "admin/passkeys/list": () => ({ output: data }),
    });
    const result = await callApi(api.admin.passkeys.list(), []);

    expect(result._tag).toBe("Succeeded");

    if (result._tag === "Succeeded") {
      expect<ApiOutputs["admin"]["passkeys"]["list"]>(result.data).toEqual(
        data,
      );
    }
  });

  test("呼び出し側が扱う code だけを Failed の型と値に持つ", async () => {
    const { api } = createFakeApi({
      "admin/passkeys/delete": () => ({ error: "LAST_PASSKEY" }),
    });
    const result = await callApi(api.admin.passkeys.delete(INPUT), [
      "LAST_PASSKEY",
    ]);

    if (result._tag !== "Failed") {
      throw new Error("削除が成功した");
    }

    expect<"LAST_PASSKEY">(result.code).toBe("LAST_PASSKEY");
  });

  test.each([
    new ORPCError("NOT_FOUND", { defined: true }),
    new ORPCError("UNAUTHORIZED", { defined: true }),
    new ORPCError("LAST_PASSKEY"),
    new ORPCError("INTERNAL_SERVER_ERROR"),
    new TypeError("通信に失敗した"),
  ])("扱わない失敗をそのまま throw する ($message)", async (expected) => {
    const api = rejectingApi(expected);

    const failure = await callApi(api.admin.passkeys.delete(INPUT), [
      "LAST_PASSKEY",
    ]).catch((reason: unknown) => reason);

    expect(failure).toBe(expected);
  });

  test("procedure の contract に無い code は型の誤りにする", async () => {
    const { api } = createFakeApi({
      "admin/passkeys/list": () => ({ output: { passkeys: [] } }),
    });
    // @ts-expect-error -- 一覧には LAST_PASSKEY の定義が無い
    const result = await callApi(api.admin.passkeys.list(), ["LAST_PASSKEY"]);

    expect(result._tag).toBe("Succeeded");
  });
});
