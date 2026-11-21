import { describe, expect, test } from "bun:test";

import { type CborMap, decodeCbor } from "../../cbor/decode-cbor";
import { convertToDerSignature } from "../../fake-authenticator/convert-to-der-signature";
import {
  type CborInput,
  encodeCbor,
} from "../../fake-authenticator/encode-cbor";
import { encodeCoseKey } from "../../fake-authenticator/encode-cose-key";
import {
  SIGN_PARAMS,
  generateTestKeyPair,
} from "../../fake-authenticator/generate-test-key-pair";
import { COSE_ALGORITHM } from "../cose-algorithm";
import { importCoseKey } from "../import-cose-key";

const es256Map = async (): Promise<CborMap> => {
  const pair = await generateTestKeyPair(COSE_ALGORITHM.ES256);
  const decoded = decodeCbor(
    await encodeCoseKey(pair.publicKey, COSE_ALGORITHM.ES256),
  );

  if (decoded._tag !== "Decoded" || !(decoded.value instanceof Map)) {
    throw new Error("COSE_Key が map でない");
  }

  return decoded.value;
};

const replaced = (
  map: CborMap,
  [key, value]: readonly [number, CborInput | undefined],
): Uint8Array<ArrayBuffer> => {
  const copy = new Map(map as ReadonlyMap<number | string, CborInput>);

  if (value === undefined) {
    copy.delete(key);
  } else {
    copy.set(key, value);
  }

  return encodeCbor(copy);
};

const rsaKey = (
  modulus: Uint8Array,
  exponent: Uint8Array,
): Uint8Array<ArrayBuffer> =>
  encodeCbor(
    new Map<number, CborInput>([
      [1, 3],
      [3, COSE_ALGORITHM.RS256],
      [-1, modulus],
      [-2, exponent],
    ]),
  );

const bits = (length: number): Uint8Array => {
  const bytes = new Uint8Array(Math.ceil(length / 8)).fill(0xff);
  const unused = bytes.length * 8 - length;

  bytes[0] = 0xff >> unused;

  return bytes;
};

const EXPONENT_65537 = new Uint8Array([1, 0, 1]);

const problemOf = async (cose: Uint8Array<ArrayBuffer>): Promise<string> => {
  const imported = await importCoseKey(cose);

  return imported._tag === "Rejected" ? imported.problem : "";
};

describe("COSE の鍵の読み込み", () => {
  test.each([
    ["ES256", COSE_ALGORITHM.ES256],
    ["EdDSA", COSE_ALGORITHM.EdDSA],
    ["RS256", COSE_ALGORITHM.RS256],
  ] as const)(
    "%s:WebCrypto で作った鍵を COSE に直して戻すと、認証器の形の署名を検証できること",
    async (_, algorithm) => {
      const pair = await generateTestKeyPair(algorithm);
      const imported = await importCoseKey(
        await encodeCoseKey(pair.publicKey, algorithm),
      );
      const data = new TextEncoder().encode("signed data");
      const signed = new Uint8Array(
        await crypto.subtle.sign(SIGN_PARAMS[algorithm], pair.privateKey, data),
      );
      const signature =
        algorithm === COSE_ALGORITHM.ES256
          ? convertToDerSignature(signed)
          : signed;

      if (imported._tag !== "Imported") {
        throw new Error(imported.problem);
      }

      expect(imported.algorithm).toBe(algorithm);
      expect(await imported.verify(signature, data)).toEqual({
        _tag: "Passed",
      });
      expect(
        await imported.verify(signature, new Uint8Array(data.length)),
      ).toMatchObject({ _tag: "Rejected", problem: "署名が合わない" });
    },
    20_000,
  );

  test("アルゴリズムと鍵の型・曲線が合わなければ拒むこと", async () => {
    const map = await es256Map();

    expect(await problemOf(replaced(map, [3, COSE_ALGORITHM.EdDSA]))).toContain(
      "鍵の型",
    );
    expect(await problemOf(replaced(map, [3, COSE_ALGORITHM.RS256]))).toContain(
      "鍵の型",
    );
    expect(await problemOf(replaced(map, [-1, 2]))).toContain("曲線");
  });

  test("扱わないアルゴリズムと、アルゴリズムの無い鍵を拒むこと", async () => {
    const map = await es256Map();

    expect(await problemOf(replaced(map, [3, -35]))).toContain(
      "扱わないアルゴリズム",
    );
    expect(await problemOf(replaced(map, [3, undefined]))).toContain(
      "アルゴリズムが無い",
    );
  });

  test("座標の長さが違う鍵を拒むこと", async () => {
    const map = await es256Map();

    expect(await problemOf(replaced(map, [-2, new Uint8Array(31)]))).toContain(
      "長さ",
    );
  });

  test("曲線の上に無い鍵は、WebCrypto が読めずに throw すること", () => {
    expect(
      importCoseKey(
        encodeCbor(
          new Map<number, CborInput>([
            [1, 2],
            [3, COSE_ALGORITHM.ES256],
            [-1, 1],
            [-2, new Uint8Array(32).fill(1)],
            [-3, new Uint8Array(32).fill(1)],
          ]),
        ),
      ),
    ).rejects.toThrow();
  });

  test("秘密鍵の項目が混ざった鍵を、公開鍵として受け取らないこと", async () => {
    const map = await es256Map();

    expect(
      await problemOf(replaced(map, [-4, new Uint8Array(32).fill(9)])),
    ).toContain("秘密鍵");
    expect(
      await problemOf(
        encodeCbor(
          new Map<number, CborInput>([
            [1, 3],
            [3, COSE_ALGORITHM.RS256],
            [-1, bits(2048)],
            [-2, EXPONENT_65537],
            [-3, bits(2040)],
          ]),
        ),
      ),
    ).toContain("秘密鍵");
  });

  test("map でないものと、末尾に余りがあるものを拒むこと", async () => {
    const cose = encodeCbor(await es256Map());

    expect(await problemOf(encodeCbor([1, 2]))).toContain("map でない");
    expect(await problemOf(new Uint8Array([...cose, 0x00]))).toContain("余り");
  });

  describe("RSA の法と公開指数", () => {
    test("法が 2048〜4096 ビットで、公開指数が 65537 の鍵を通すこと", async () => {
      for (const length of [2048, 3072, 4096]) {
        expect(
          await importCoseKey(rsaKey(bits(length), EXPONENT_65537)),
        ).toMatchObject({
          _tag: "Imported",
          algorithm: COSE_ALGORITHM.RS256,
        });
      }
    });

    test("法の長さを、バイト数でなくビット数で数えて、2048 ビットより短い鍵を拒むこと", async () => {
      for (const modulus of [
        bits(1024),
        bits(2047),
        new Uint8Array([0, ...bits(2047)]),
      ]) {
        expect(await problemOf(rsaKey(modulus, EXPONENT_65537))).toContain(
          "2048 ビットより短い",
        );
      }
    });

    test("4096 ビットより長い法を拒むこと", async () => {
      expect(await problemOf(rsaKey(bits(4097), EXPONENT_65537))).toContain(
        "4096 ビットより長い",
      );
    });

    test.each([
      { title: "1", exponent: new Uint8Array([1]), problem: "3 より小さい" },
      { title: "0", exponent: new Uint8Array([0]), problem: "3 より小さい" },
      { title: "偶数", exponent: new Uint8Array([1, 0, 0]), problem: "偶数" },
      {
        title: "34 ビット",
        exponent: new Uint8Array([3, 0, 0, 0, 1]),
        problem: "33 ビットより大きい",
      },
      {
        title: "法と同じ長さ",
        exponent: bits(2048),
        problem: "33 ビットより大きい",
      },
    ])("公開指数が $title の鍵を拒むこと", async ({ exponent, problem }) => {
      expect(await problemOf(rsaKey(bits(2048), exponent))).toContain(problem);
    });

    test("33 ビットまでの奇数の公開指数は、先頭に 0 があっても通すこと", async () => {
      for (const exponent of [
        new Uint8Array([3]),
        new Uint8Array([1, 0, 0, 0, 1]),
        new Uint8Array([0, 0, 1, 0, 1]),
      ]) {
        expect((await importCoseKey(rsaKey(bits(2048), exponent)))._tag).toBe(
          "Imported",
        );
      }
    });
  });
});
