import type { AddPasskeyResult } from "@/features/passkeys/add-passkey";
import type { DeletePasskeyResult } from "@/features/passkeys/delete-passkey";
import type { MessageKey } from "@/i18n/use-translate";

type PasskeyNotice = {
  /** 知らせの用途。 */
  readonly tone: "info" | "warning" | "danger";
  /** 知らせの文言の訳のキー。 */
  readonly message: MessageKey;
};

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

type AddNoticeOutcome = Exclude<AddPasskeyResult["_tag"], "Added"> | Unexpected;
type DeleteNoticeOutcome =
  | Exclude<DeletePasskeyResult["_tag"], "Deleted">
  | Unexpected;

const COMMON = {
  Cancelled: { tone: "info", message: "passkeys.cancelled" },
  ReauthenticationFailed: {
    tone: "danger",
    message: "passkeys.reauthenticationFailed",
  },
  Unexpected: { tone: "danger", message: "passkeys.failed" },
} satisfies Readonly<Record<string, PasskeyNotice>>;

const ADD: Readonly<Record<AddNoticeOutcome, PasskeyNotice>> = {
  ...COMMON,
  ChallengeExpired: { tone: "warning", message: "passkeys.expired" },
  AlreadyRegistered: { tone: "danger", message: "passkeys.alreadyRegistered" },
  Rejected: { tone: "danger", message: "passkeys.rejected" },
};

const DELETE: Readonly<Record<DeleteNoticeOutcome, PasskeyNotice>> = {
  ...COMMON,
  LastPasskey: { tone: "danger", message: "passkeys.lastPasskey" },
  NotFound: { tone: "warning", message: "passkeys.notFound" },
};

/** パスキーの追加の失敗やキャンセルを、Dialog の知らせにする。 */
export const toAddNotice = (outcome: AddNoticeOutcome): PasskeyNotice =>
  ADD[outcome];

/** パスキーの削除の失敗やキャンセルを、Dialog の知らせにする。 */
export const toDeleteNotice = (outcome: DeleteNoticeOutcome): PasskeyNotice =>
  DELETE[outcome];
