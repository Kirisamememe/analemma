import { describe, expect, test } from "bun:test";

import { formatAaguid } from "@/features/auth/registration/format-aaguid";
import { keepKnownTransports } from "@/features/auth/registration/keep-known-transports";

describe("transports", () => {
  test("仕様にある値だけを、重ねずに順のまま残すこと", () => {
    expect(
      keepKnownTransports([
        "internal",
        "x".repeat(400_000),
        "hybrid",
        "internal",
        "USB",
        "",
        "smart-card",
      ]),
    ).toEqual(["internal", "hybrid", "smart-card"]);
  });

  test("仕様の6つの値を、すべて残すこと", () => {
    const known = ["usb", "nfc", "ble", "smart-card", "hybrid", "internal"];

    expect(keepKnownTransports(known)).toEqual(known);
  });
});

test("AAGUID を、UUID の形の小文字の16進にすること", () => {
  expect(
    formatAaguid(Uint8Array.fromHex("ADCE000235BCC60A648B0B25F1F05503")),
  ).toBe("adce0002-35bc-c60a-648b-0b25f1f05503");
  expect(formatAaguid(new Uint8Array(16))).toBe(
    "00000000-0000-0000-0000-000000000000",
  );
});
