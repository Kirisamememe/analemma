import { describe, expect, test } from "bun:test";

import {
  toIssueFailure,
  toRevokeFailure,
} from "@/features/deploy-tokens/logic/to-deploy-token-notice";

describe("toIssueFailure", () => {
  test.each([
    ["ReauthenticationFailed", "deployTokens.reauthenticationFailed"],
    ["Unexpected", "deployTokens.failed"],
  ] as const)("%s は %s の文言で知らせる", (outcome, message) => {
    expect(toIssueFailure(outcome)).toBe(message);
  });
});

describe("toRevokeFailure", () => {
  test.each([
    ["NotFound", "deployTokens.notFound"],
    ["Unexpected", "deployTokens.failed"],
  ] as const)("%s は %s の文言で知らせる", (outcome, message) => {
    expect(toRevokeFailure(outcome)).toBe(message);
  });
});
