import { readDatabaseEnv } from "../platform/env";
import { stdoutLogger } from "../platform/logger";
import { migrateDatabase } from "./migrate-database";

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
