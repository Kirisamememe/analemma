import { join } from "node:path";

const COMPOSE_FILE = join(
  import.meta.dirname,
  "../../../../..",
  "compose.yaml",
);

/** compose.yaml の project の名前。 */
export const COMPOSE_PROJECT = "analemma";

const COMPOSE_RETRY = { attempts: 3, delayMs: 1000 };

/** Docker Compose で起動できなかったこと。 */
export type ComposeFailed = {
  /** どの結果か。 */
  readonly _tag: "ComposeFailed";
  /** docker compose が標準エラーに書いたもの。 */
  readonly output: string;
};

/** テスト用の PostgreSQL を起動した結果。 */
export type StartTestPostgresResult =
  | ComposeFailed
  | {
      /** どの結果か。 */
      readonly _tag: "Started" | "DockerNotFound";
    };

const composeUp = async (
  docker: string,
  attemptsLeft: number,
): Promise<StartTestPostgresResult> => {
  const compose = Bun.spawn(
    [
      docker,
      "compose",
      "--file",
      COMPOSE_FILE,
      "--project-name",
      COMPOSE_PROJECT,
      "--progress",
      "quiet",
      "up",
      "--detach",
      "--wait",
      "postgres-test",
    ],
    { stdout: "ignore", stderr: "pipe" },
  );

  const [exitCode, output] = await Promise.all([
    compose.exited,
    new Response(compose.stderr).text(),
  ]);

  if (exitCode === 0) {
    return { _tag: "Started" };
  }

  if (attemptsLeft <= 1) {
    return { _tag: "ComposeFailed", output };
  }

  await Bun.sleep(COMPOSE_RETRY.delayMs);

  return composeUp(docker, attemptsLeft - 1);
};

/** テスト用の PostgreSQL を Docker Compose で起動する。 */
export const startTestPostgres = async (): Promise<StartTestPostgresResult> => {
  const docker = Bun.which("docker");

  return docker === null
    ? { _tag: "DockerNotFound" }
    : composeUp(docker, COMPOSE_RETRY.attempts);
};
