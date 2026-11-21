import { Database } from "bun:sqlite";

/** 手元の DB。 */
export const database = new Database(":memory:");
