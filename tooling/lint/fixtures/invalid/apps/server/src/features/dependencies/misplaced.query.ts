import { sql } from "drizzle-orm";

export const now = sql`now()`;

/** 型だけを読む書き方。 */
export type DrizzleQuery = import("drizzle-orm").SQL;
