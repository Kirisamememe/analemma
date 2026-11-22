import { sql } from "drizzle-orm";

export const now = sql`now()`;

export { pgTable } from "drizzle-orm/pg-core";
