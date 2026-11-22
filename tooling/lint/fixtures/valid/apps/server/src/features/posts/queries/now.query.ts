import { sql } from "drizzle-orm";

/** DB の現在時刻を表す SQL。 */
export const nowSql = sql`now()`;
