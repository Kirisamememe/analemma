import { createExternalApp } from "@/../../server/src/app";

export { parseDatabaseUrl } from "@/../../server/src/platform/startup/parse-database-url";

/** server のアプリを作る関数。 */
export const make = createExternalApp;
