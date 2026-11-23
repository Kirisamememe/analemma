import type { ContractOutputs } from "@analemma/contract";

import type { PasskeyRow } from "@/features/auth/registration/queries/insert-passkey.query";

/** 管理画面に返すパスキー。 */
export type PasskeySummary = ContractOutputs["admin"]["passkeys"]["rename"];

/** パスキーの行を、管理画面に返す形にする。 */
export const toPasskeySummary = (row: PasskeyRow): PasskeySummary => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
  lastUsedAt: row.lastUsedAt.toISOString(),
  backedUp: row.backedUp,
});
