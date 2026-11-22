import { describe, expect, test } from "bun:test";

import {
  equalSecretHashes,
  issueSecretToken,
  readSecretToken,
} from "@/features/auth/secret-token/secret-token";

describe("token", () => {
  test("作った token を読むと、同じ ID と secret のハッシュに戻ること", async () => {
    const issued = await issueSecretToken();
    const read = await readSecretToken(issued.token);

    expect(issued.token).toMatch(/^[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}$/v);
    expect(read).toEqual({
      _tag: "Read",
      id: issued.id,
      secretHash: issued.secretHash,
    });
  });

  test("作るたびに、違う token になること", async () => {
    const tokens = await Promise.all(
      Array.from({ length: 10 }, async () => (await issueSecretToken()).token),
    );

    expect(new Set(tokens).size).toBe(10);
  });

  test.each([
    "",
    "abc",
    "A".repeat(22),
    `${"A".repeat(22)}.${"B".repeat(42)}`,
    `${"A".repeat(21)}.${"B".repeat(43)}`,
    `${"A".repeat(22)}.${"B".repeat(43)}.`,
    `${"A".repeat(22)}.${"B".repeat(42)}=`,
    `${"A".repeat(22)}.${"B".repeat(42)}+`,
    ` ${"A".repeat(22)}.${"B".repeat(43)}`,
  ])("形の違う token %p を読まないこと", async (token) => {
    expect(await readSecretToken(token)).toEqual({ _tag: "Malformed" });
  });

  test("secret の文字列が違えば、同じバイト列に戻る書き方でも、ハッシュが違うこと", async () => {
    const id = "A".repeat(22);
    const canonical = await readSecretToken(`${id}.${"A".repeat(42)}A`);
    const nonCanonical = await readSecretToken(`${id}.${"A".repeat(42)}B`);

    if (canonical._tag !== "Read" || nonCanonical._tag !== "Read") {
      throw new Error("token を読めなかった");
    }

    expect(
      equalSecretHashes(canonical.secretHash, nonCanonical.secretHash),
    ).toBe(false);
  });
});

describe("secret のハッシュの比較", () => {
  test("同じ中身なら true、1ビットでも違うか長さが違えば false を返すこと", () => {
    const hash = new Uint8Array(32).fill(7);
    const flipped = hash.slice();

    flipped[31] = 6;

    expect(equalSecretHashes(hash, hash.slice())).toBe(true);
    expect(equalSecretHashes(hash, flipped)).toBe(false);
    expect(equalSecretHashes(hash, hash.subarray(0, 31))).toBe(false);
    expect(equalSecretHashes(new Uint8Array(), new Uint8Array())).toBe(true);
  });
});
