import { describe, expect, test } from "bun:test";

import { createEnrollmentRoutes } from "../create-enrollment-routes";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

describe("createEnrollmentRoutes", () => {
  test("登録が成功するまでは 401、成功した後はセッションを返し、受け取った入力を残す", async () => {
    const server = createEnrollmentRoutes(EXPIRY);

    expect(await server.routes["admin/session/get"]?.(undefined)).toEqual({
      error: "UNAUTHORIZED",
      status: 401,
    });
    expect(
      await server.routes["auth/enrollment/register"]?.({ token: "a.b" }),
    ).toEqual(EXPIRY);
    expect(server.registered()).toEqual({ token: "a.b" });
    expect(await server.routes["admin/session/get"]?.(undefined)).toEqual(
      EXPIRY,
    );
  });

  test("登録が失敗を返したら、401 のまま", async () => {
    const failure = { error: "INVALID_ENROLLMENT", status: 403 };
    const server = createEnrollmentRoutes(failure);

    await server.routes["auth/enrollment/register"]?.({ token: "a.b" });

    expect(await server.routes["admin/session/get"]?.(undefined)).toEqual({
      error: "UNAUTHORIZED",
      status: 401,
    });
  });
});
