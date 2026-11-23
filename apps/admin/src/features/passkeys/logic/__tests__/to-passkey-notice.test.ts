import { describe, expect, test } from "bun:test";

import {
  toAddFailure,
  toDeleteFailure,
} from "@/features/passkeys/logic/to-passkey-notice";

describe("toAddFailure", () => {
  test.each([
    ["ReauthenticationFailed", "passkeys.reauthenticationFailed"],
    ["ChallengeExpired", "passkeys.expired"],
    ["AlreadyRegistered", "passkeys.alreadyRegistered"],
    ["Rejected", "passkeys.rejected"],
    ["Unexpected", "passkeys.failed"],
  ] as const)("%s は %s の文言で知らせる", (outcome, message) => {
    expect(toAddFailure(outcome)).toBe(message);
  });
});

describe("toDeleteFailure", () => {
  test.each([
    ["ReauthenticationFailed", "passkeys.reauthenticationFailed"],
    ["LastPasskey", "passkeys.lastPasskey"],
    ["NotFound", "passkeys.notFound"],
    ["Unexpected", "passkeys.failed"],
  ] as const)("%s は %s の文言で知らせる", (outcome, message) => {
    expect(toDeleteFailure(outcome)).toBe(message);
  });
});
