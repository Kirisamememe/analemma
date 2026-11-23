import { sql as otherSql } from "@example/drizzle-orm";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { z } from "zod";

export const now = sql`now()`;
export const schema = z.string();
export const connect = { postgres, otherSql };
