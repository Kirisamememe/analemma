import { migrateDatabase } from "@/db/migrate-database";
import { readDatabaseEnv } from "@/platform/env";
import { stdoutLogger } from "@/platform/logger";

const env = readDatabaseEnv();
const { added, applied } = await migrateDatabase({
  target: env.database,
  logger: stdoutLogger,
});

stdoutLogger.write({
  level: "info",
  message: "migration を適用した",
  details: { added, total: applied.length },
});
