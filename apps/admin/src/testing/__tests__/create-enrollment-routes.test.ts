import { safe } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createEnrollmentRoutes } from "../create-enrollment-routes";
import { createFakeApi } from "../create-fake-api";
import { FAKE_ATTESTATION } from "../create-fake-authenticator";

const EXPIRY = { expiresAt: "2026-01-08T00:00:00.000Z" };
const REGISTRATION = {
  token: "a.b",
  name: "MacBook",
  credential: FAKE_ATTESTATION,
};

describe("createEnrollmentRoutes", () => {
  test("登録が成功するまでは 401、成功した後はセッションを返し、受け取った入力を残す", async () => {
    const server = createEnrollmentRoutes({ output: EXPIRY });
    const { api } = createFakeApi(server.routes);
    const before: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(before).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(await api.auth.enrollment.register(REGISTRATION)).toEqual(EXPIRY);
    expect(server.registered()).toEqual(REGISTRATION);
    expect(await api.admin.session.get()).toEqual(EXPIRY);
  });

  test("登録が失敗を返したら、401 のまま", async () => {
    const { api } = createFakeApi(
      createEnrollmentRoutes({ error: "INVALID_ENROLLMENT" }).routes,
    );
    await safe(api.auth.enrollment.register(REGISTRATION));
    const session: unknown = await api.admin.session
      .get()
      .catch((error: unknown) => error);

    expect(session).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });
});
