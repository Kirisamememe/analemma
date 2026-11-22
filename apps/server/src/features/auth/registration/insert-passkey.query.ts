import { passkey } from "../../../db/schema/passkey";
import type { DatabaseExecutor } from "../../../platform/database";
import type { NewPasskey } from "./verify-passkey-registration";

/** パスキーの行。 */
export type PasskeyRow = typeof passkey.$inferSelect;

/** 保存するパスキーと、その持ち主と名前。 */
export type PasskeyInsert = {
  /** 検証できたパスキー。 */
  readonly passkey: NewPasskey;
  /** 管理者の ID。 */
  readonly adminUserId: number;
  /** 管理画面で見分けるための名前。 */
  readonly name: string;
  /** 登録した日時。 */
  readonly now: Date;
};

/** 保存できたパスキーの行。 */
export type InsertedPasskey = {
  /** どの結果か。 */
  readonly _tag: "Inserted";
  /** 保存した行。 */
  readonly row: PasskeyRow;
};

/** 同じ資格情報の ID のパスキーが、すでにあったこと。 */
export type DuplicatePasskey = {
  /** どの結果か。 */
  readonly _tag: "Duplicate";
};

/** 検証できたパスキーを保存する。 */
export const insertPasskey = async (
  db: DatabaseExecutor,
  { adminUserId, name, now, passkey: verified }: PasskeyInsert,
): Promise<InsertedPasskey | DuplicatePasskey> => {
  const [row] = await db
    .insert(passkey)
    .values({
      ...verified,
      transports: [...verified.transports],
      adminUserId,
      name,
      createdAt: now,
      lastUsedAt: now,
    })
    .onConflictDoNothing({ target: passkey.id })
    .returning();

  return row === undefined ? { _tag: "Duplicate" } : { _tag: "Inserted", row };
};
