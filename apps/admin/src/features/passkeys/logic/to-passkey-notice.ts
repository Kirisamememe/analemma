import type { AddPasskeyResult } from "@/features/passkeys/queries/add-passkey";
import type { DeletePasskeyResult } from "@/features/passkeys/queries/delete-passkey";
import type { MessageKey } from "@/i18n/use-translate";

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

type AddFailure =
  | Exclude<AddPasskeyResult["_tag"], "Added" | "Cancelled">
  | Unexpected;
type DeleteFailure =
  | Exclude<DeletePasskeyResult["_tag"], "Deleted" | "Cancelled">
  | Unexpected;

const COMMON = {
  ReauthenticationFailed: "passkeys.reauthenticationFailed",
  Unexpected: "passkeys.failed",
} satisfies Readonly<Record<string, MessageKey>>;

const ADD: Readonly<Record<AddFailure, MessageKey>> = {
  ...COMMON,
  ChallengeExpired: "passkeys.expired",
  AlreadyRegistered: "passkeys.alreadyRegistered",
  Rejected: "passkeys.rejected",
};

const DELETE: Readonly<Record<DeleteFailure, MessageKey>> = {
  ...COMMON,
  LastPasskey: "passkeys.lastPasskey",
  NotFound: "passkeys.notFound",
};

/** パスキーの追加の失敗を、失敗の Toast の文言の訳のキーにする。 */
export const toAddFailure = (outcome: AddFailure): MessageKey => ADD[outcome];

/** パスキーの削除の失敗を、失敗の Toast の文言の訳のキーにする。 */
export const toDeleteFailure = (outcome: DeleteFailure): MessageKey =>
  DELETE[outcome];
