import type { EnrollResult } from "@/features/auth/enroll";
import type { LogInResult } from "@/features/auth/log-in";
import type { MessageKey } from "@/i18n/use-translate";

/** 画面に出す `Notice` の中身。 */
export type AuthNotice = {
  /** 知らせの用途。 */
  readonly tone: "info" | "warning" | "danger";
  /** 知らせの文言の訳のキー。 */
  readonly message: MessageKey;
};

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

/** ログインの結果を、画面の知らせにする(知らせることが無ければ undefined)。 */
export const toLogInNotice = (
  outcome: LogInResult["_tag"] | Unexpected,
): AuthNotice | undefined => {
  switch (outcome) {
    case "LoggedIn": {
      return undefined;
    }
    case "Cancelled": {
      return { tone: "info", message: "login.cancelled" };
    }
    case "ChallengeExpired": {
      return { tone: "warning", message: "login.expired" };
    }
    case "UnknownPasskey": {
      return { tone: "danger", message: "login.unknownPasskey" };
    }
    case "Rejected": {
      return { tone: "danger", message: "login.rejected" };
    }
    case "Unexpected": {
      return { tone: "danger", message: "login.failed" };
    }
  }
};

/** 登録の結果を、画面の知らせにする(知らせることが無ければ undefined)。 */
export const toEnrollNotice = (
  outcome: EnrollResult["_tag"] | Unexpected,
): AuthNotice | undefined => {
  switch (outcome) {
    case "Enrolled": {
      return undefined;
    }
    case "Cancelled": {
      return { tone: "info", message: "enroll.cancelled" };
    }
    case "InvalidEnrollment": {
      return { tone: "danger", message: "enroll.invalid" };
    }
    case "ChallengeExpired": {
      return { tone: "warning", message: "enroll.expired" };
    }
    case "AlreadyRegistered": {
      return { tone: "danger", message: "enroll.alreadyRegistered" };
    }
    case "Rejected": {
      return { tone: "danger", message: "enroll.rejected" };
    }
    case "Unexpected": {
      return { tone: "danger", message: "enroll.failed" };
    }
  }
};
