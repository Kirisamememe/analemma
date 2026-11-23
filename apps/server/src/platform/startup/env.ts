import { z } from "zod";

import { parseDatabaseUrl } from "@/platform/parse-database-url";
import { parseRelyingParty } from "@/platform/parse-relying-party";

const portSchema = z
  .string()
  .regex(/^[0-9]+$/v, { error: "0〜65535 の数で書く" })
  .transform(Number)
  .pipe(z.number().int().min(0).max(65_535, { error: "0〜65535 の数で書く" }));

const hostSchema = z
  .string()
  .regex(/^[^\s\/]+$/v, { error: "ホストの名前か IP アドレスで書く" })
  .default("127.0.0.1");

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
    ADMIN_DIST_DIR: z
      .string()
      .min(1, { error: "フォルダのパスを書く" })
      .optional(),
    PORT: portSchema.default(8787),
    INTERNAL_PORT: portSchema.default(8788),
    INTERNAL_HOST: hostSchema,
    DATABASE_URL: databaseUrlSchema,
    AUTH_ORIGIN: z.string({ error: "設定されていない" }),
    AUTH_RP_ID: z.string({ error: "設定されていない" }),
  })
  .refine(({ INTERNAL_PORT, PORT }) => PORT === 0 || PORT !== INTERNAL_PORT, {
    error: "PORT と同じ番号にはできない",
    path: ["INTERNAL_PORT"],
  })
  .transform((source, context) => {
    const parsed = parseRelyingParty({
      origin: source.AUTH_ORIGIN,
      rpId: source.AUTH_RP_ID,
    });

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
      adminDistDir: source.ADMIN_DIST_DIR,
      port: source.PORT,
      internal: { port: source.INTERNAL_PORT, host: source.INTERNAL_HOST },
      database: source.DATABASE_URL,
      relyingParty: parsed.relyingParty,
    };
  });

const serverEnvSchema = z
  .object({
    MEDIA_DIR: z
      .string({ error: "設定されていない" })
      .min(1, { error: "フォルダのパスを書く" }),
  })
  .and(envSchema)
  .transform(({ MEDIA_DIR, ...env }) => ({ ...env, mediaDir: MEDIA_DIR }));

/** 環境変数の名前と値。 */
type EnvSource = Readonly<Record<string, string | undefined>>;

/** 登録用 URL のコマンドが起動時に検証した環境変数。 */
export type Env = z.output<typeof envSchema>;

/** server が起動時に検証した、置き場所のフォルダを含む環境変数。 */
export type ServerEnv = z.output<typeof serverEnvSchema>;

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

/** 登録用 URL のコマンドの環境変数を読み、スキーマで検証する。 */
export const readEnv = (source: EnvSource = Bun.env): Env =>
  parseEnv(envSchema, source);

/** server の環境変数を、配信用の画像の置き場所も含めて読み、スキーマで検証する。 */
export const readServerEnv = (source: EnvSource = Bun.env): ServerEnv =>
  parseEnv(serverEnvSchema, source);

/** migration のような DB だけを使うコマンドの環境変数を読み、検証する。 */
export const readDatabaseEnv = (source: EnvSource = Bun.env): DatabaseEnv =>
  parseEnv(databaseEnvSchema, source);
