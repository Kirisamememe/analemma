import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { bytes } from "./bytes";

/** 種類の定義を送るための、デプロイ用のトークンのテーブル。 */
export const deployToken = pgTable("deploy_token", {
  id: text("id").primaryKey(),
  secretHash: bytes("secret_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});
