import type { EnrollResult } from "@/features/auth/queries/enroll";
import type { LogInResult } from "@/features/auth/queries/log-in";
import type { MessageKey } from "@/i18n/use-translate";

/** ログインと登録の結果を知らせる置き場所と文言。 */
export type AuthNotice = {
  /** 失敗の Toast か、画面の状態として残す `Notice` か。 */
  readonly place: "Toast" | "Notice";
  /** 知らせの文言の訳のキー。 */
  readonly message: MessageKey;
};

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

const toast = (message: MessageKey): AuthNotice => ({
  place: "Toast",
  message,
});

/** ログインの結果を、知らせにする(知らせることが無ければ undefined)。 */
export const toLogInNotice = (
  outcome: LogInResult["_tag"] | Unexpected,
): AuthNotice | undefined => {
  switch (outcome) {
    case "LoggedIn":
    case "Cancelled": {
      return undefined;
    }
    case "ChallengeExpired": {
      return toast("login.expired");
    }
    case "UnknownPasskey": {
      return toast("login.unknownPasskey");
    }
    case "Rejected": {
      return toast("login.rejected");
    }
    case "Unexpected": {
      return toast("login.failed");
    }
  }
};

/** 登録の結果を、知らせにする(知らせることが無ければ undefined)。 */
export const toEnrollNotice = (
  outcome: EnrollResult["_tag"] | Unexpected,
): AuthNotice | undefined => {
  switch (outcome) {
    case "Enrolled":
    case "Cancelled": {
      return undefined;
    }
    case "InvalidEnrollment": {
      return { place: "Notice", message: "enroll.invalid" };
    }
    case "AlreadyRegistered": {
      return { place: "Notice", message: "enroll.alreadyRegistered" };
    }
    case "ChallengeExpired": {
      return toast("enroll.expired");
    }
    case "Rejected": {
      return toast("enroll.rejected");
    }
    case "Unexpected": {
      return toast("enroll.failed");
    }
  }
};
