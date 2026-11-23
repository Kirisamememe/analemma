import { describe, expect, test } from "bun:test";

import { checkDeployTokenName } from "@/features/deploy-tokens/issue/logic/check-deploy-token-name";
import type { MessageKey } from "@/i18n/use-translate";

const CASES: readonly (readonly [string, MessageKey | undefined])[] = [
  ["本番のデプロイ", undefined],
  ["a".repeat(64), undefined],
  ["", "deployTokens.invalidName"],
  ["   ", "deployTokens.invalidName"],
  ["a".repeat(65), "deployTokens.invalidName"],
  ["本番\nのデプロイ", "deployTokens.invalidName"],
];

describe("checkDeployTokenName", () => {
  test.each(CASES)("%p は %p", (name, expected) => {
    expect(checkDeployTokenName(name)).toBe(expected);
  });
});
