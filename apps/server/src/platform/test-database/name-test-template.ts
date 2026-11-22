import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";

import type { MigrationFingerprint } from "@/db/read-migrations";

const HASH_LENGTH = 16;

const DRIZZLE_VERSION = z
  .object({ version: z.string() })
  .parse(
    JSON.parse(
      readFileSync(
        Bun.resolveSync("drizzle-orm/package.json", import.meta.dir),
        "utf8",
      ),
    ),
  ).version;

/** テンプレートの DB の名前を決める。 */
export const nameTestTemplate = (
  migrations: readonly MigrationFingerprint[],
): string => {
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        drizzle: DRIZZLE_VERSION,
        migrations: migrations.map(({ hash, name }) => [name, hash]),
      }),
    )
    .digest("hex");

  return `analemma_template_${digest.slice(0, HASH_LENGTH)}`;
};
