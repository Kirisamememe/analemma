import type { PlainMessageKey } from "../../i18n/translation";
import type { AddPasskeyResult } from "./add-passkey";
import type { DeletePasskeyResult } from "./delete-passkey";

/** パスキーの操作の結果の知らせ。 */
export type PasskeyNotice = {
  /** 知らせの用途。 */
  readonly tone: "info" | "success" | "warning" | "danger";
  /** 知らせの文言の訳のキー。 */
  readonly message: PlainMessageKey;
};

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

const COMMON: Readonly<Record<string, PasskeyNotice>> = {
  Cancelled: { tone: "info", message: "passkeys.cancelled" },
  ReauthenticationFailed: {
    tone: "danger",
    message: "passkeys.reauthenticationFailed",
  },
  Unexpected: { tone: "danger", message: "passkeys.failed" },
};

const ADD: Readonly<Record<string, PasskeyNotice>> = {
  ...COMMON,
  Added: { tone: "success", message: "passkeys.added" },
  ChallengeExpired: { tone: "warning", message: "passkeys.expired" },
  AlreadyRegistered: { tone: "danger", message: "passkeys.alreadyRegistered" },
  Rejected: { tone: "danger", message: "passkeys.rejected" },
};

const DELETE: Readonly<Record<string, PasskeyNotice>> = {
  ...COMMON,
  Deleted: { tone: "success", message: "passkeys.deleted" },
  LastPasskey: { tone: "danger", message: "passkeys.lastPasskey" },
  NotFound: { tone: "warning", message: "passkeys.notFound" },
};

/** パスキーを追加した結果を、画面の知らせにする。 */
export const toAddNotice = (
  outcome: AddPasskeyResult["_tag"] | Unexpected,
): PasskeyNotice | undefined => ADD[outcome];

/** パスキーを削除した結果を、画面の知らせにする。 */
export const toDeleteNotice = (
  outcome: DeletePasskeyResult["_tag"] | Unexpected,
): PasskeyNotice | undefined => DELETE[outcome];
