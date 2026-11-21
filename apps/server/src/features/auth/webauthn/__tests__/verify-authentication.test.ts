import { describe, expect, test } from "bun:test";

import { COSE_ALGORITHM } from "../cose-key/cose-algorithm";
import { AUTHENTICATOR_FLAG } from "../fake-authenticator/build-authenticator-data";
import {
  type FakeAuthenticationInput,
  createFakeAuthentication,
} from "../fake-authenticator/create-fake-authentication";
import {
  type FakeAuthenticator,
  createFakeAuthenticator,
} from "../fake-authenticator/create-fake-authenticator";
import {
  type AuthenticationExpectation,
  type AuthenticationResponse,
  verifyAuthentication,
} from "../verify-authentication";
import { verifyRegistration } from "../verify-registration";
import {
  W3C_RELYING_PARTY,
  W3C_TEST_VECTORS,
  type W3cTestVector,
} from "../w3c-test-vectors";

const F = AUTHENTICATOR_FLAG;
const ORIGIN = "https://analemma.test";
const RP_ID = "analemma.test";
const CHALLENGE = new Uint8Array(32).fill(0x24);

const expectationFor = (
  authenticator: FakeAuthenticator,
): AuthenticationExpectation => ({
  challenge: CHALLENGE,
  origin: ORIGIN,
  rpId: RP_ID,
  requireUserVerification: true,
  publicKey: authenticator.publicKey,
  algorithm: authenticator.algorithm,
  signCount: 0,
  backupEligible: true,
});

const respond = async (
  authenticator: FakeAuthenticator,
  broken: Partial<FakeAuthenticationInput> = {},
): Promise<AuthenticationResponse> =>
  createFakeAuthentication({
    authenticator,
    challenge: CHALLENGE,
    origin: ORIGIN,
    rpId: RP_ID,
    ...broken,
  });

const flipped = (
  bytes: Uint8Array<ArrayBuffer>,
  index: number,
): Uint8Array<ArrayBuffer> => {
  const copy = bytes.slice();

  copy[index] = (copy[index] ?? 0) ^ 0x01;

  return copy;
};

const hex = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.fromHex(text);

const problemOf = (
  result: Awaited<ReturnType<typeof verifyAuthentication>>,
): string => (result._tag === "Rejected" ? result.problem : "");

const verifyVector = async (
  { authentication, registration }: W3cTestVector,
  requireUserVerification: boolean,
): ReturnType<typeof verifyAuthentication> => {
  const registered = await verifyRegistration(
    {
      clientDataJSON: hex(registration.clientDataJSON),
      attestationObject: hex(registration.attestationObject),
    },
    {
      ...W3C_RELYING_PARTY,
      challenge: hex(registration.challenge),
      algorithms: [
        COSE_ALGORITHM.EdDSA,
        COSE_ALGORITHM.ES256,
        COSE_ALGORITHM.RS256,
      ],
      requireUserVerification: false,
    },
  );

  if (registered._tag === "Rejected") {
    throw new Error(registered.problem);
  }

  return verifyAuthentication(
    {
      clientDataJSON: hex(authentication.clientDataJSON),
      authenticatorData: hex(authentication.authenticatorData),
      signature: hex(authentication.signature),
    },
    {
      ...W3C_RELYING_PARTY,
      challenge: hex(authentication.challenge),
      requireUserVerification,
      publicKey: registered.publicKey,
      algorithm: registered.algorithm,
      signCount: registered.signCount,
      backupEligible: registered.backupEligible,
    },
  );
};

describe("ログインの検証", () => {
  test.each([
    ["ES256", COSE_ALGORITHM.ES256],
    ["EdDSA", COSE_ALGORITHM.EdDSA],
    ["RS256", COSE_ALGORITHM.RS256],
  ] as const)(
    "%s:登録で受け取った公開鍵で、署名を確かめて通すこと",
    async (_, algorithm) => {
      const authenticator = await createFakeAuthenticator({ algorithm });

      expect(
        await verifyAuthentication(
          await respond(authenticator),
          expectationFor(authenticator),
        ),
      ).toEqual({
        _tag: "Verified",
        signCount: 0,
        backedUp: true,
        counterWentBack: false,
        backupEligibilityChanged: false,
      });
    },
    20_000,
  );

  test("署名・authenticatorData・clientDataJSON のどれかを変えると、署名が合わないこと", async () => {
    const authenticator = await createFakeAuthenticator();
    const response = await respond(authenticator);
    const withExtraField = new TextEncoder().encode(
      new TextDecoder()
        .decode(response.clientDataJSON)
        .replace(/\}$/v, ',"extraData":"added"}'),
    );

    for (const tampered of [
      { ...response, signature: flipped(response.signature, 10) },
      {
        ...response,
        authenticatorData: flipped(response.authenticatorData, 36),
      },
      { ...response, clientDataJSON: withExtraField },
    ]) {
      expect(
        problemOf(
          await verifyAuthentication(tampered, expectationFor(authenticator)),
        ),
      ).toContain("署名が合わない");
    }
  });

  test("別の認証器の署名を拒むこと", async () => {
    const owner = await createFakeAuthenticator();
    const other = await createFakeAuthenticator();

    expect(
      problemOf(
        await verifyAuthentication(await respond(other), expectationFor(owner)),
      ),
    ).toContain("署名が合わない");
  });

  test.each(
    (
      [
        ["登録の type の", { type: "webauthn.create" }, "type"],
        ["違う challenge の", { challenge: new Uint8Array(32) }, "challenge"],
        ["違う origin の", { origin: "https://evil.example" }, "origin"],
        ["ほかの RP ID の", { rpId: "evil.example" }, "rpIdHash"],
        ["UV の無い", { flags: F.UP }, "UV"],
      ] satisfies [string, Partial<FakeAuthenticationInput>, string][]
    ).map(([title, broken, problem]) => ({ title, broken, problem })),
  )("$title 応答を拒むこと", async ({ broken, problem }) => {
    const authenticator = await createFakeAuthenticator();

    expect(
      problemOf(
        await verifyAuthentication(
          await respond(authenticator, broken),
          expectationFor(authenticator),
        ),
      ),
    ).toContain(problem);
  });

  test("保存したアルゴリズムと公開鍵が食い違えば、想定外の失敗として投げること", async () => {
    const authenticator = await createFakeAuthenticator();
    const response = await respond(authenticator);

    expect(
      verifyAuthentication(response, {
        ...expectationFor(authenticator),
        algorithm: COSE_ALGORITHM.EdDSA,
      }),
    ).rejects.toThrow("保存した");
    expect(
      verifyAuthentication(response, {
        ...expectationFor(authenticator),
        publicKey: new Uint8Array([0xa0]),
      }),
    ).rejects.toThrow("保存した");
  });

  test("登録したときと BE が違っても拒まず、変わったことを返すこと", async () => {
    const authenticator = await createFakeAuthenticator();
    const changed = async (
      registered: boolean,
      flags: number,
    ): Promise<unknown> => {
      const verified = await verifyAuthentication(
        await respond(authenticator, { flags }),
        { ...expectationFor(authenticator), backupEligible: registered },
      );

      return verified._tag === "Verified"
        ? verified.backupEligibilityChanged
        : verified;
    };

    expect(await changed(true, F.UP | F.UV | F.BE)).toBe(false);
    expect(await changed(true, F.UP | F.UV)).toBe(true);
    expect(await changed(false, F.UP | F.UV | F.BE)).toBe(true);
  });

  test("先頭に BOM のある clientDataJSON を読み、届いたバイト列のまま署名を確かめること", async () => {
    const authenticator = await createFakeAuthenticator();

    expect(
      await verifyAuthentication(
        await respond(authenticator, { withBom: true }),
        expectationFor(authenticator),
      ),
    ).toMatchObject({ _tag: "Verified" });
  });

  test("資格情報の入った authenticatorData のログインを拒むこと", async () => {
    const authenticator = await createFakeAuthenticator();

    expect(
      problemOf(
        await verifyAuthentication(
          await respond(authenticator, {
            flags: F.UP | F.UV | F.BE | F.BS | F.AT,
            withCredential: true,
          }),
          expectationFor(authenticator),
        ),
      ),
    ).toContain("AT");
  });

  test("signCount が戻っても拒まず、戻ったことを返すこと", async () => {
    const authenticator = await createFakeAuthenticator();
    const wentBack = async (
      stored: number,
      received: number,
    ): Promise<unknown> => {
      const verified = await verifyAuthentication(
        await respond(authenticator, { signCount: received }),
        { ...expectationFor(authenticator), signCount: stored },
      );

      return verified._tag === "Verified" ? verified.counterWentBack : verified;
    };

    expect(await wentBack(0, 0)).toBe(false);
    expect(await wentBack(5, 6)).toBe(false);
    expect(await wentBack(5, 5)).toBe(true);
    expect(await wentBack(5, 0)).toBe(true);
    expect(await wentBack(0xff_ff_ff_ff, 1)).toBe(true);
  });

  describe("W3C の Test Vectors", () => {
    const vectors = W3C_TEST_VECTORS;

    test.each([
      ["16.2(ES256)", vectors.noneEs256],
      ["16.6(長い ID)", vectors.longCredentialId],
      ["16.10(RS256)", vectors.packedRs256],
      ["16.11(Ed25519)", vectors.packedEd25519],
    ])(
      "UV の立っていない %s のログインを、UV を求めずに通すこと",
      async (_, vector) => {
        expect(await verifyVector(vector, false)).toMatchObject({
          _tag: "Verified",
          counterWentBack: false,
        });
      },
    );

    test("16.7(UV あり)のログインを、UV を求めて通すこと", async () => {
      expect(await verifyVector(vectors.packedEs256, true)).toEqual({
        _tag: "Verified",
        signCount: 0,
        backedUp: false,
        counterWentBack: false,
        backupEligibilityChanged: false,
      });
    });
  });
});
