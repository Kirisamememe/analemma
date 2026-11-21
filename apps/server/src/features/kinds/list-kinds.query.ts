import { asc } from "drizzle-orm";

import { kind } from "../../db/schema/kind";
import type { DatabaseExecutor } from "../../platform/database";
import type { KindRow } from "./find-kind.query";

/** 種類を、名前の順に並べる。 */
export const listKinds = async (db: DatabaseExecutor): Promise<KindRow[]> =>
  db.select().from(kind).orderBy(asc(kind.name));
