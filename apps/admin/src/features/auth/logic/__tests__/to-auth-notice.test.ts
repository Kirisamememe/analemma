import { describe, expect, test } from "bun:test";

import {
  toEnrollNotice,
  toLogInNotice,
} from "@/features/auth/logic/to-auth-notice";

describe("toLogInNotice", () => {
  test.each(["LoggedIn", "Cancelled"] as const)(
    "%s は、何も知らせない",
    (outcome) => {
      expect(toLogInNotice(outcome)).toBeUndefined();
    },
  );

  test.each([
    ["ChallengeExpired", "login.expired"],
    ["UnknownPasskey", "login.unknownPasskey"],
    ["Rejected", "login.rejected"],
    ["Unexpected", "login.failed"],
  ] as const)("%s は、失敗の Toast で %s を知らせる", (outcome, message) => {
    expect(toLogInNotice(outcome)).toEqual({ place: "Toast", message });
  });
});

describe("toEnrollNotice", () => {
  test.each(["Enrolled", "Cancelled"] as const)(
    "%s は、何も知らせない",
    (outcome) => {
      expect(toEnrollNotice(outcome)).toBeUndefined();
    },
  );

  test.each([
    ["InvalidEnrollment", "enroll.invalid"],
    ["AlreadyRegistered", "enroll.alreadyRegistered"],
  ] as const)(
    "%s は、押し直しても変わらないので、画面の Notice で %s を知らせる",
    (outcome, message) => {
      expect(toEnrollNotice(outcome)).toEqual({ place: "Notice", message });
    },
  );

  test.each([
    ["ChallengeExpired", "enroll.expired"],
    ["Rejected", "enroll.rejected"],
    ["Unexpected", "enroll.failed"],
  ] as const)("%s は、失敗の Toast で %s を知らせる", (outcome, message) => {
    expect(toEnrollNotice(outcome)).toEqual({ place: "Toast", message });
  });
});
