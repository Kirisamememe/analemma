import { migrateDatabase } from "@/db/migrate-database";
import { stdoutLogger } from "@/platform/logger";
import { readDatabaseEnv } from "@/platform/startup/env";

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
