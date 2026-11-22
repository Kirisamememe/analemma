import { describe, expect, test } from "bun:test";

import { toAddNotice, toDeleteNotice } from "../to-passkey-notice";

describe("toAddNotice", () => {
  test.each([
    { outcome: "Cancelled", tone: "info", message: "passkeys.cancelled" },
    {
      outcome: "ReauthenticationFailed",
      tone: "danger",
      message: "passkeys.reauthenticationFailed",
    },
    {
      outcome: "ChallengeExpired",
      tone: "warning",
      message: "passkeys.expired",
    },
    {
      outcome: "AlreadyRegistered",
      tone: "danger",
      message: "passkeys.alreadyRegistered",
    },
    { outcome: "Rejected", tone: "danger", message: "passkeys.rejected" },
    { outcome: "Unexpected", tone: "danger", message: "passkeys.failed" },
  ] as const)(
    "$outcome は $tone の知らせにする",
    ({ outcome, tone, message }) => {
      expect(toAddNotice(outcome)).toEqual({ tone, message });
    },
  );
});

describe("toDeleteNotice", () => {
  test.each([
    { outcome: "Cancelled", tone: "info", message: "passkeys.cancelled" },
    {
      outcome: "ReauthenticationFailed",
      tone: "danger",
      message: "passkeys.reauthenticationFailed",
    },
    { outcome: "LastPasskey", tone: "danger", message: "passkeys.lastPasskey" },
    { outcome: "NotFound", tone: "warning", message: "passkeys.notFound" },
    { outcome: "Unexpected", tone: "danger", message: "passkeys.failed" },
  ] as const)(
    "$outcome は $tone の知らせにする",
    ({ outcome, tone, message }) => {
      expect(toDeleteNotice(outcome)).toEqual({ tone, message });
    },
  );
});
