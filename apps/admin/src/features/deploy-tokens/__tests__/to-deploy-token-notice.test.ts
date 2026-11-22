import { describe, expect, test } from "bun:test";

import {
  toCopyNotice,
  toIssueNotice,
  toRevokeNotice,
} from "@/features/deploy-tokens/to-deploy-token-notice";

describe("toIssueNotice", () => {
  test("キャンセルは誤りとして読み上げず、失敗は誤りとして知らせる", () => {
    expect(toIssueNotice("Cancelled").tone).toBe("info");
    expect(toIssueNotice("ReauthenticationFailed").tone).toBe("danger");
    expect(toIssueNotice("Unexpected").tone).toBe("danger");
  });
});

describe("toRevokeNotice", () => {
  test("もう無いトークンは注意、想定外の失敗は誤りとして知らせる", () => {
    expect(toRevokeNotice("NotFound").tone).toBe("warning");
    expect(toRevokeNotice("Unexpected").tone).toBe("danger");
  });
});

describe("toCopyNotice", () => {
  test("コピーできたら成功、できなければ誤りとして知らせる", () => {
    expect(toCopyNotice("Copied")).toEqual({
      tone: "success",
      message: "deployTokens.copied",
    });
    expect(toCopyNotice("Failed")).toEqual({
      tone: "danger",
      message: "deployTokens.copyFailed",
    });
  });
});
