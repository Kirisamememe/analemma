import { z } from "zod";

import { parseDatabaseUrl } from "./parse-database-url";
import { parseRelyingParty } from "./parse-relying-party";

const portSchema = z
  .string()
  .regex(/^[0-9]+$/v, { error: "0〜65535 の数で書く" })
  .transform(Number)
  .pipe(z.number().int().min(0).max(65_535, { error: "0〜65535 の数で書く" }))
  .default(8787);

const databaseUrlSchema = z
  .string({ error: "設定されていない" })
  .transform((value, context) => {
    const parsed = parseDatabaseUrl(value);

    if (parsed._tag === "Invalid") {
      context.issues.push({
        code: "custom",
        message: parsed.problem,
        input: undefined,
      });

      return z.NEVER;
    }

    return parsed.target;
  });

const databaseEnvSchema = z
  .object({ DATABASE_URL: databaseUrlSchema })
  .transform(({ DATABASE_URL }) => ({ database: DATABASE_URL }));

const envSchema = z
  .object({
    PORT: portSchema,
    DATABASE_URL: databaseUrlSchema,
    AUTH_ORIGIN: z.string({ error: "設定されていない" }),
    AUTH_RP_ID: z.string({ error: "設定されていない" }),
  })
  .transform(({ AUTH_ORIGIN, AUTH_RP_ID, DATABASE_URL, PORT }, context) => {
    const parsed = parseRelyingParty({ origin: AUTH_ORIGIN, rpId: AUTH_RP_ID });

    if (parsed._tag === "Invalid") {
      context.issues.push({
        code: "custom",
        message: parsed.problem,
        path: [parsed.variable],
        input: undefined,
      });

      return z.NEVER;
    }

    return {
      port: PORT,
      database: DATABASE_URL,
      relyingParty: parsed.relyingParty,
    };
  });

/** 環境変数の名前と値。 */
type EnvSource = Readonly<Record<string, string | undefined>>;

/** server の起動時に検証した環境変数。 */
export type Env = z.output<typeof envSchema>;

/** DB だけを使うコマンドが検証した環境変数。 */
export type DatabaseEnv = z.output<typeof databaseEnvSchema>;

const parseEnv = <T>(schema: z.ZodType<T>, source: EnvSource): T => {
  const result = schema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  const problems = result.error.issues.map(
    (issue) => `${issue.path.map(String).join(".")}: ${issue.message}`,
  );

  throw new Error(`環境変数が正しくない。\n${problems.join("\n")}`);
};

/** server とコマンドの環境変数を読み、スキーマで検証する。 */
export const readEnv = (source: EnvSource = Bun.env): Env =>
  parseEnv(envSchema, source);

/** migration のような DB だけを使うコマンドの環境変数を読み、検証する。 */
export const readDatabaseEnv = (source: EnvSource = Bun.env): DatabaseEnv =>
  parseEnv(databaseEnvSchema, source);
