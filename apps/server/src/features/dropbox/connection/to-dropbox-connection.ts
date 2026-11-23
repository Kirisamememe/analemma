import type { ContractOutputs } from "@analemma/contract";

import type { DropboxConnectionRow } from "@/features/dropbox/connection/queries/dropbox-connection.query";

/** Dropbox とのつながりの行を、管理用 API の出力にする。 */
export const toDropboxConnection = (
  available: boolean,
  row: DropboxConnectionRow | undefined,
): ContractOutputs["admin"]["dropbox"]["get"] => ({
  available,
  connectedAt: row?.connectedAt.toISOString() ?? null,
});
