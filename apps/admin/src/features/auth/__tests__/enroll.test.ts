import { describe, expect, test } from "bun:test";

import {
  type FakeReply,
  type FakeRoutes,
  createFakeApi,
} from "../../../testing/create-fake-api";
import { enroll } from "../enroll";
import type { Authenticator } from "../webauthn/create-authenticator";

const OPTIONS = {
  challenge: "AQID",
  rp: { id: "localhost", name: "Analemma" },
  user: { id: "BAU", name: "admin", displayName: "管理者" },
  pubKeyCredParams: [{ type: "public-key", alg: -8 }],
  excludeCredentials: [],
  authenticatorSelection: {
    residentKey: "required",
    requireResidentKey: true,
    userVerification: "required",
  },
  attestation: "none",
  timeout: 300_000,
};

const CREDENTIAL = {
  id: "credential-id",
  type: "public-key" as const,
  response: {
    clientDataJSON: "AQ",
    attestationObject: "Ag",
    transports: ["internal"],
  },
};

const registering = (
  answer: Awaited<ReturnType<Authenticator["register"]>>,
): Authenticator => ({
  authenticate: () => Promise.resolve({ _tag: "Cancelled" }),
  register: () => Promise.resolve(answer),
});

const answering = registering({ _tag: "Answered", credential: CREDENTIAL });

/** 作り物の server の、登録の2つの procedure の応答。 */
type EnrollmentReplies = {
  /** options の応答。 */
  readonly options?: FakeReply;
  /** 登録の応答。 */
  readonly register?: FakeReply;
};

const serverReplying = ({
  options = { output: OPTIONS },
  register = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } },
}: EnrollmentReplies) => {
  const sent: unknown[] = [];
  const routes: FakeRoutes = {
    "auth/enrollment/options": (input) => {
      sent.push(input);

      return options;
    },
    "auth/enrollment/register": (input) => {
      sent.push(input);

      return register;
    },
  };

  return { ...createFakeApi(routes), sent };
};

const INPUT = { token: "abc.def", name: "MacBook" };

describe("enroll", () => {
  test("登録用 URL の token で options を取り、作ったパスキーを名前と一緒に登録する", async () => {
    const server = serverReplying({});

    expect(
      await enroll({ api: server.api, authenticator: answering }, INPUT),
    ).toEqual({ _tag: "Enrolled" });
    expect(server.sent).toEqual([
      { token: "abc.def" },
      { token: "abc.def", name: "MacBook", credential: CREDENTIAL },
    ]);
  });

  test("使えない登録用 URL なら、認証器に尋ねずに知らせる", async () => {
    const server = serverReplying({
      options: { error: "INVALID_ENROLLMENT", status: 403 },
    });

    expect(
      await enroll({ api: server.api, authenticator: answering }, INPUT),
    ).toEqual({ _tag: "InvalidEnrollment" });
    expect(server.calls).toEqual(["auth/enrollment/options"]);
  });

  test.each([
    { answer: { _tag: "Cancelled" }, expected: "Cancelled" },
    { answer: { _tag: "AlreadyRegistered" }, expected: "AlreadyRegistered" },
  ] as const)(
    "認証器が $answer._tag なら、登録しない",
    async ({ answer, expected }) => {
      const server = serverReplying({});

      expect(
        await enroll(
          { api: server.api, authenticator: registering(answer) },
          INPUT,
        ),
      ).toEqual({ _tag: expected });
      expect(server.calls).toEqual(["auth/enrollment/options"]);
    },
  );

  test.each([
    { error: "INVALID_ENROLLMENT", status: 403, expected: "InvalidEnrollment" },
    { error: "CHALLENGE_EXPIRED", status: 400, expected: "ChallengeExpired" },
    {
      error: "DUPLICATE_CREDENTIAL",
      status: 409,
      expected: "AlreadyRegistered",
    },
    { error: "INVALID_CREDENTIAL", status: 400, expected: "Rejected" },
  ])(
    "登録で server の $error を $expected として返す",
    async ({ error, status, expected }) => {
      const server = serverReplying({ register: { error, status } });

      expect(
        await enroll({ api: server.api, authenticator: answering }, INPUT),
      ).toEqual({ _tag: expected });
    },
  );

  test("origin を断られたら(設定の誤り)、想定外の失敗として throw する", () => {
    const server = serverReplying({
      options: { error: "FORBIDDEN", status: 403 },
    });

    expect(
      enroll({ api: server.api, authenticator: answering }, INPUT),
    ).rejects.toThrow();
  });
});
