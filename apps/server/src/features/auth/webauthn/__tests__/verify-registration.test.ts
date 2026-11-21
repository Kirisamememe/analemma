import { describe, expect, test } from "bun:test";

import { decodeCbor, isCborMap } from "../cbor/decode-cbor";
import { COSE_ALGORITHM } from "../cose-key/cose-algorithm";
import {
  AUTHENTICATOR_FLAG,
  buildAuthenticatorData,
  hashRpId,
} from "../fake-authenticator/build-authenticator-data";
import {
  type FakeAuthenticator,
  createFakeAuthenticator,
} from "../fake-authenticator/create-fake-authenticator";
import {
  type FakeRegistrationInput,
  createFakeRegistration,
} from "../fake-authenticator/create-fake-registration";
import { type CborInput, encodeCbor } from "../fake-authenticator/encode-cbor";
import {
  type RegistrationExpectation,
  type RegistrationResponse,
  verifyRegistration,
} from "../verify-registration";
import {
  W3C_RELYING_PARTY,
  W3C_TEST_VECTORS,
  type W3cTestVector,
} from "../w3c-test-vectors";

const F = AUTHENTICATOR_FLAG;
const ORIGIN = "https://analemma.test";
const RP_ID = "analemma.test";
const CHALLENGE = new Uint8Array(32).fill(0x42);

const expectation: RegistrationExpectation = {
  challenge: CHALLENGE,
  origin: ORIGIN,
  rpId: RP_ID,
  algorithms: [
    COSE_ALGORITHM.EdDSA,
    COSE_ALGORITHM.ES256,
    COSE_ALGORITHM.RS256,
  ],
  requireUserVerification: true,
};

const respond = async (
  authenticator: FakeAuthenticator,
  broken: Partial<FakeRegistrationInput> = {},
): Promise<RegistrationResponse> =>
  createFakeRegistration({
    authenticator,
    challenge: CHALLENGE,
    origin: ORIGIN,
    rpId: RP_ID,
    ...broken,
  });

const hex = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.fromHex(text);

const text = (value: string): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(value);

const problemOf = (
  result: Awaited<ReturnType<typeof verifyRegistration>>,
): string => (result._tag === "Rejected" ? result.problem : "");

const verifyVector = async (
  { registration }: W3cTestVector,
  requireUserVerification: boolean,
): ReturnType<typeof verifyRegistration> =>
  verifyRegistration(
    {
      clientDataJSON: hex(registration.clientDataJSON),
      attestationObject: hex(registration.attestationObject),
    },
    {
      ...W3C_RELYING_PARTY,
      challenge: hex(registration.challenge),
      algorithms: expectation.algorithms,
      requireUserVerification,
    },
  );

describe("登録の検証", () => {
  test.each([
    ["ES256", COSE_ALGORITHM.ES256],
    ["EdDSA", COSE_ALGORITHM.EdDSA],
    ["RS256", COSE_ALGORITHM.RS256],
  ] as const)(
    "%s:正しい応答を通し、保存する値を返すこと",
    async (_, algorithm) => {
      const authenticator = await createFakeAuthenticator({ algorithm });

      expect(
        await verifyRegistration(await respond(authenticator), expectation),
      ).toEqual({
        _tag: "Verified",
        credentialId: authenticator.credentialId,
        publicKey: authenticator.publicKey,
        algorithm,
        signCount: 0,
        aaguid: authenticator.aaguid,
        backupEligible: true,
        backedUp: true,
      });
    },
    20_000,
  );

  test.each(
    (
      [
        ["ログインの type の", { type: "webauthn.get" }, "type"],
        ["違う challenge の", { challenge: new Uint8Array(32) }, "challenge"],
        ["違う origin の", { origin: "https://evil.example" }, "origin"],
        ["似た origin の", { origin: "https://analemma.test:8443" }, "origin"],
        ["crossOrigin が true の", { crossOrigin: true }, "crossOrigin"],
        [
          "topOrigin のある",
          { topOrigin: "https://evil.example" },
          "topOrigin",
        ],
        ["ほかの RP ID の", { rpId: "evil.example" }, "rpIdHash"],
        ["UP の無い", { flags: F.UV | F.AT }, "UP"],
        ["UV の無い", { flags: F.UP | F.AT }, "UV"],
        ["AT の無い", { flags: F.UP | F.UV }, "余り"],
        ["BE が無いのに BS のある", { flags: F.UP | F.UV | F.BS | F.AT }, "BS"],
        ["末尾に余りのある", { trailing: new Uint8Array([0]) }, "余り"],
      ] satisfies [string, Partial<FakeRegistrationInput>, string][]
    ).map(([title, broken, problem]) => ({ title, broken, problem })),
  )("$title 応答を拒むこと", async ({ broken, problem }) => {
    const authenticator = await createFakeAuthenticator();

    expect(
      problemOf(
        await verifyRegistration(
          await respond(authenticator, broken),
          expectation,
        ),
      ),
    ).toContain(problem);
  });

  test("資格情報の無い authenticatorData を拒むこと", async () => {
    const response = await respond(await createFakeAuthenticator());
    const attestationObject = encodeCbor(
      new Map<string, CborInput>([
        ["fmt", "none"],
        ["attStmt", new Map()],
        [
          "authData",
          buildAuthenticatorData({
            rpIdHash: await hashRpId(RP_ID),
            flags: F.UP | F.UV,
            signCount: 0,
          }),
        ],
      ]),
    );

    expect(
      problemOf(
        await verifyRegistration(
          { ...response, attestationObject },
          expectation,
        ),
      ),
    ).toContain("AT が立っていない");
  });

  test("UV を求めないときは、UV の無い応答も通すこと", async () => {
    const response = await respond(await createFakeAuthenticator(), {
      flags: F.UP | F.AT,
    });

    expect(
      await verifyRegistration(response, {
        ...expectation,
        requireUserVerification: false,
      }),
    ).toMatchObject({ _tag: "Verified" });
  });

  test("資格情報の ID を、16〜1023 バイトだけ通すこと", async () => {
    for (const length of [16, 1023]) {
      const authenticator = await createFakeAuthenticator({
        credentialIdLength: length,
      });

      expect(
        await verifyRegistration(await respond(authenticator), expectation),
      ).toMatchObject({
        _tag: "Verified",
        credentialId: authenticator.credentialId,
      });
    }
  });

  test.each([
    { length: 0, problem: "16 バイトより短い" },
    { length: 1, problem: "16 バイトより短い" },
    { length: 15, problem: "16 バイトより短い" },
    { length: 1024, problem: "1023 バイトより長い" },
  ])(
    "$length バイトの資格情報の ID を拒むこと",
    async ({ length, problem }) => {
      const authenticator = await createFakeAuthenticator({
        credentialIdLength: length,
      });

      expect(
        problemOf(
          await verifyRegistration(await respond(authenticator), expectation),
        ),
      ).toContain(problem);
    },
  );

  test("options に並べていないアルゴリズムを拒むこと", async () => {
    const authenticator = await createFakeAuthenticator({
      algorithm: COSE_ALGORITHM.EdDSA,
    });

    expect(
      problemOf(
        await verifyRegistration(await respond(authenticator), {
          ...expectation,
          algorithms: [COSE_ALGORITHM.ES256],
        }),
      ),
    ).toContain("options に並べていないアルゴリズム");
  });

  test("JSON として読めない clientDataJSON では、throw すること", async () => {
    const response = await respond(await createFakeAuthenticator());

    for (const clientDataJSON of [text("{"), new Uint8Array([0xff])]) {
      expect(
        verifyRegistration({ ...response, clientDataJSON }, expectation),
      ).rejects.toThrow(SyntaxError);
    }
  });

  test("UTF-8 として読めないバイトは置換文字になり、origin の照合で拒むこと", async () => {
    const response = await respond(await createFakeAuthenticator());
    const challenge = CHALLENGE.toBase64({
      alphabet: "base64url",
      omitPadding: true,
    });
    const clientDataJSON = new Uint8Array([
      ...text(
        `{"type":"webauthn.create","challenge":"${challenge}","origin":"${ORIGIN}`,
      ),
      0xff,
      ...text('"}'),
    ]);

    expect(
      problemOf(
        await verifyRegistration({ ...response, clientDataJSON }, expectation),
      ),
    ).toContain("origin");
  });

  test("壊れた clientDataJSON と attestationObject を拒むこと", async () => {
    const response = await respond(await createFakeAuthenticator());

    for (const clientDataJSON of [
      text("[]"),
      text('{"type":"webauthn.create","origin":"https://analemma.test"}'),
    ]) {
      expect(
        problemOf(
          await verifyRegistration(
            { ...response, clientDataJSON },
            expectation,
          ),
        ),
      ).toContain("clientDataJSON");
    }

    expect(
      problemOf(
        await verifyRegistration(
          {
            ...response,
            attestationObject: new Uint8Array([
              ...response.attestationObject,
              0,
            ]),
          },
          expectation,
        ),
      ),
    ).toContain("余り");
    expect(
      problemOf(
        await verifyRegistration(
          {
            ...response,
            attestationObject: encodeCbor(
              new Map<string, CborInput>([
                ["fmt", "none"],
                ["attStmt", new Map()],
              ]),
            ),
          },
          expectation,
        ),
      ),
    ).toContain("authData が無い");
  });

  test("attestationObject の fmt と attStmt の形が違えば拒むこと", async () => {
    const authenticator = await createFakeAuthenticator();
    const response = await respond(authenticator);
    const decoded = decodeCbor(response.attestationObject);

    if (decoded._tag !== "Decoded" || !isCborMap(decoded.value)) {
      throw new Error("attestationObject が map でない");
    }

    const authData = decoded.value.get("authData") ?? null;
    const withEntries = (
      entries: [string, CborInput][],
    ): Uint8Array<ArrayBuffer> =>
      encodeCbor(
        new Map<string, CborInput>([...entries, ["authData", authData]]),
      );

    for (const [attestationObject, problem] of [
      [withEntries([["attStmt", new Map()]]), "fmt"],
      [
        withEntries([
          ["fmt", 1],
          ["attStmt", new Map()],
        ]),
        "fmt",
      ],
      [withEntries([["fmt", "none"]]), "attStmt"],
      [
        withEntries([
          ["fmt", "none"],
          ["attStmt", []],
        ]),
        "attStmt",
      ],
      [
        withEntries([
          ["fmt", "none"],
          ["attStmt", new Map([["sig", 1]])],
        ]),
        "attStmt",
      ],
    ] as const) {
      expect(
        problemOf(
          await verifyRegistration(
            { ...response, attestationObject },
            expectation,
          ),
        ),
      ).toContain(problem);
    }
  });

  test("clientDataJSON の先頭の BOM を、UTF-8 の読み取りで落とすこと", async () => {
    const response = await respond(await createFakeAuthenticator());
    const clientDataJSON = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...response.clientDataJSON,
    ]);

    expect(
      await verifyRegistration({ ...response, clientDataJSON }, expectation),
    ).toMatchObject({ _tag: "Verified" });
  });

  describe("W3C の Test Vectors", () => {
    const vectors = W3C_TEST_VECTORS;

    test("16.2(attestation 無しの ES256)を通し、資格情報の ID が例と同じこと", async () => {
      expect(await verifyVector(vectors.noneEs256, false)).toMatchObject({
        _tag: "Verified",
        credentialId: hex(vectors.noneEs256.registration.credentialId),
        algorithm: COSE_ALGORITHM.ES256,
      });
    });

    test("16.2 は UV が立っていないので、UV を求めると拒むこと", async () => {
      expect(problemOf(await verifyVector(vectors.noneEs256, true))).toContain(
        "UV",
      );
    });

    test("16.4・16.5(crossOrigin が true)を拒むこと", async () => {
      expect(
        problemOf(await verifyVector(vectors.crossOrigin, false)),
      ).toContain("crossOrigin");
      expect(problemOf(await verifyVector(vectors.topOrigin, false))).toContain(
        "crossOrigin",
      );
    });

    test("16.6(1023 バイトの資格情報の ID)を通すこと", async () => {
      const verified = await verifyVector(vectors.longCredentialId, false);

      expect(
        verified._tag === "Verified" ? verified.credentialId.length : 0,
      ).toBe(1023);
    });

    test("16.7(packed の attestation、UV あり)を、attestation を見ずに通すこと", async () => {
      expect(await verifyVector(vectors.packedEs256, true)).toMatchObject({
        _tag: "Verified",
        algorithm: COSE_ALGORITHM.ES256,
      });
    });

    test("16.10(RS256)と 16.11(Ed25519)を通すこと", async () => {
      expect(await verifyVector(vectors.packedRs256, true)).toMatchObject({
        algorithm: COSE_ALGORITHM.RS256,
      });
      expect(await verifyVector(vectors.packedEd25519, false)).toMatchObject({
        algorithm: COSE_ALGORITHM.EdDSA,
      });
    });

    test("16.8(ES384)は扱わないアルゴリズムなので拒むこと", async () => {
      expect(
        problemOf(await verifyVector(vectors.packedEs384, false)),
      ).toContain("扱わないアルゴリズム");
    });
  });
});
