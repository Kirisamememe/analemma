import type { IssueDeployTokenResult } from "@/features/deploy-tokens/issue/queries/issue-deploy-token";
import type { RevokeDeployTokenResult } from "@/features/deploy-tokens/queries/revoke-deploy-token";
import type { MessageKey } from "@/i18n/use-translate";

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

type IssueFailure =
  | Exclude<IssueDeployTokenResult["_tag"], "Issued" | "Cancelled">
  | Unexpected;
type RevokeFailure =
  | Exclude<RevokeDeployTokenResult["_tag"], "Revoked">
  | Unexpected;

const ISSUE: Readonly<Record<IssueFailure, MessageKey>> = {
  ReauthenticationFailed: "deployTokens.reauthenticationFailed",
  Unexpected: "deployTokens.failed",
};

const REVOKE: Readonly<Record<RevokeFailure, MessageKey>> = {
  NotFound: "deployTokens.notFound",
  Unexpected: "deployTokens.failed",
};

/** 発行の失敗を、失敗の Toast の文言の訳のキーにする。 */
export const toIssueFailure = (outcome: IssueFailure): MessageKey =>
  ISSUE[outcome];

/** 取り消しの失敗を、失敗の Toast の文言の訳のキーにする。 */
export const toRevokeFailure = (outcome: RevokeFailure): MessageKey =>
  REVOKE[outcome];
