import type { ContractOutputs } from "@analemma/contract";

import type { DropboxConnectionRow } from "@/features/dropbox/connection/queries/dropbox-connection.query";

/** 管理画面に返す、Dropbox との接続の状態。 */
export type DropboxConnection = ContractOutputs["admin"]["dropbox"]["get"];

/** 接続の行を、管理画面に返す接続の状態にする。 */
export const toDropboxConnection = (
  row:
    | Pick<DropboxConnectionRow, "accountName" | "accountEmail" | "connectedAt">
    | undefined,
): DropboxConnection =>
  row === undefined
    ? { status: "disconnected" }
    : {
        status: "connected",
        accountName: row.accountName,
        accountEmail: row.accountEmail,
        connectedAt: row.connectedAt.toISOString(),
      };
