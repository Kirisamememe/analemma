import { describe, expect, test } from "bun:test";

import { createFakeApi } from "../../../testing/create-fake-api";
import { renamePasskey } from "../rename-passkey";

describe("renamePasskey", () => {
  test("ID と新しい名前を送り、名前を変更する", async () => {
    let sent: unknown;
    const { api } = createFakeApi({
      "admin/passkeys/rename": (input) => {
        sent = input;

        return {
          output: {
            id: "passkey",
            name: "iPad",
            createdAt: "2026-01-01T00:00:00.000Z",
            lastUsedAt: "2026-01-01T00:00:00.000Z",
            backedUp: false,
          },
        };
      },
    });

    expect(await renamePasskey(api, { id: "passkey", name: "iPad" })).toEqual({
      _tag: "Renamed",
    });
    expect(sent).toEqual({ id: "passkey", name: "iPad" });
  });

  test("もう無いパスキーなら、そのことを返す", async () => {
    const { api } = createFakeApi({
      "admin/passkeys/rename": () => ({ error: "NOT_FOUND", status: 404 }),
    });

    expect(await renamePasskey(api, { id: "passkey", name: "iPad" })).toEqual({
      _tag: "NotFound",
    });
  });
});
