import type { SQL } from "drizzle-orm";

import type { InternalFragment } from "../drizzle-orm";

import type { InternalFragment as AliasedFragment } from "@/features/posts/drizzle-orm";

/** SQL の断片。 */
export type Fragment = SQL;

/** 相対パスと別名で読み込んだ内部モジュールの型。 */
export type InternalFragments = [InternalFragment, AliasedFragment];

export type { PgColumn } from "drizzle-orm/pg-core";
