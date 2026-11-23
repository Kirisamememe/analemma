import type { IssueDeployTokenResult } from "@/features/deploy-tokens/issue/queries/issue-deploy-token";
import type { RevokeDeployTokenResult } from "@/features/deploy-tokens/queries/revoke-deploy-token";
import type { MessageKey } from "@/i18n/use-translate";

type DeployTokenNotice = {
  /** 知らせの用途。 */
  readonly tone: "info" | "success" | "warning" | "danger";
  /** 知らせの文言の訳のキー。 */
  readonly message: MessageKey;
};

/** 想定外の失敗で終わったこと。 */
type Unexpected = "Unexpected";

type IssueNoticeOutcome =
  | Exclude<IssueDeployTokenResult["_tag"], "Issued">
  | Unexpected;
type RevokeNoticeOutcome =
  | Exclude<RevokeDeployTokenResult["_tag"], "Revoked">
  | Unexpected;

const ISSUE: Readonly<Record<IssueNoticeOutcome, DeployTokenNotice>> = {
  Cancelled: { tone: "info", message: "deployTokens.cancelled" },
  ReauthenticationFailed: {
    tone: "danger",
    message: "deployTokens.reauthenticationFailed",
  },
  Unexpected: { tone: "danger", message: "deployTokens.failed" },
};

const REVOKE: Readonly<Record<RevokeNoticeOutcome, DeployTokenNotice>> = {
  NotFound: { tone: "warning", message: "deployTokens.notFound" },
  Unexpected: { tone: "danger", message: "deployTokens.failed" },
};

/** 発行の結果を、Dialog の知らせにする。 */
export const toIssueNotice = (
  outcome: IssueDeployTokenResult["_tag"] | Unexpected | undefined,
): DeployTokenNotice | undefined =>
  outcome === undefined || outcome === "Issued" ? undefined : ISSUE[outcome];

/** 取り消しの失敗を、Dialog の知らせにする。 */
export const toRevokeNotice = (
  outcome: RevokeNoticeOutcome,
): DeployTokenNotice => REVOKE[outcome];
