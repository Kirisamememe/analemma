import { describe, expect, test } from "bun:test";

import { toEnrollNotice, toLogInNotice } from "../to-auth-notice";

describe("toLogInNotice", () => {
  test("ログインできたら、何も知らせない", () => {
    expect(toLogInNotice("LoggedIn")).toBeUndefined();
  });

  test.each([
    { outcome: "Cancelled", tone: "info", message: "login.cancelled" },
    { outcome: "ChallengeExpired", tone: "warning", message: "login.expired" },
    {
      outcome: "UnknownPasskey",
      tone: "danger",
      message: "login.unknownPasskey",
    },
    { outcome: "Rejected", tone: "danger", message: "login.rejected" },
    { outcome: "Unexpected", tone: "danger", message: "login.failed" },
  ] as const)(
    "$outcome は $tone の知らせにする",
    ({ outcome, tone, message }) => {
      expect(toLogInNotice(outcome)).toEqual({ tone, message });
    },
  );
});

describe("toEnrollNotice", () => {
  test("登録できたら、何も知らせない", () => {
    expect(toEnrollNotice("Enrolled")).toBeUndefined();
  });

  test.each([
    { outcome: "Cancelled", tone: "info", message: "enroll.cancelled" },
    { outcome: "InvalidEnrollment", tone: "danger", message: "enroll.invalid" },
    { outcome: "ChallengeExpired", tone: "warning", message: "enroll.expired" },
    {
      outcome: "AlreadyRegistered",
      tone: "danger",
      message: "enroll.alreadyRegistered",
    },
    { outcome: "Rejected", tone: "danger", message: "enroll.rejected" },
    { outcome: "Unexpected", tone: "danger", message: "enroll.failed" },
  ] as const)(
    "$outcome は $tone の知らせにする",
    ({ outcome, tone, message }) => {
      expect(toEnrollNotice(outcome)).toEqual({ tone, message });
    },
  );
});
