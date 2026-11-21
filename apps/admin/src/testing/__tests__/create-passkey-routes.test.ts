import { describe, expect, test } from "bun:test";

import { createFakeApi } from "../create-fake-api";
import { createPasskeyRoutes } from "../create-passkey-routes";

const ASSERTION = {
  id: "current",
  type: "public-key" as const,
  response: {
    clientDataJSON: "AQ",
    authenticatorData: "Ag",
    signature: "Aw",
    userHandle: "BA",
  },
};

describe("createPasskeyRoutes", () => {
  test("足す・名前を変える・消すと、一覧が変わる", async () => {
    const server = createPasskeyRoutes([
      { id: "passkey-1", name: "MacBook", backedUp: true },
    ]);
    const { api } = createFakeApi(server.routes);

    await api.admin.passkeys.register({
      name: "iPhone",
      credential: {
        id: "new",
        type: "public-key",
        response: {
          clientDataJSON: "AQ",
          attestationObject: "Ag",
          transports: [],
        },
      },
      assertion: ASSERTION,
    });
    await api.admin.passkeys.rename({ id: "passkey-1", name: "Mac" });
    await api.admin.passkeys.delete({ id: "passkey-2", assertion: ASSERTION });

    expect(
      (await api.admin.passkeys.list()).passkeys.map(({ name }) => name),
    ).toEqual(["Mac"]);
  });

  test("決めた失敗を、次の1回だけ返す", async () => {
    const server = createPasskeyRoutes([
      { id: "passkey-1", name: "MacBook", backedUp: true },
    ]);
    const { api } = createFakeApi(server.routes);

    server.failNext("admin/passkeys/delete", {
      error: "LAST_PASSKEY",
      status: 409,
    });

    expect(
      api.admin.passkeys.delete({ id: "passkey-1", assertion: ASSERTION }),
    ).rejects.toMatchObject({ code: "LAST_PASSKEY" });
    await api.admin.passkeys.delete({ id: "passkey-1", assertion: ASSERTION });

    expect(server.passkeys()).toEqual([]);
  });
});
