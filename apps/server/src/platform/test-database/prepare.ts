import { stdoutLogger } from "@/platform/logger";
import { prepareTestTemplate } from "@/platform/test-database/prepare-test-template";
import {
  type StartTestPostgresResult,
  startTestPostgres,
} from "@/platform/test-database/start-test-postgres";

const FAILURE_MESSAGES: Record<
  Exclude<StartTestPostgresResult["_tag"], "Started">,
  string
> = {
  DockerNotFound:
    "テストには Docker が要る。docker コマンドが見つからない。Docker を入れてから、もう一度流す。",
  ComposeFailed:
    "テスト用の PostgreSQL を Docker Compose で起動できなかった。Docker が動いているか、ここから Docker に接続できるかを確かめてから、もう一度流す。",
};

process.stdout.write(
  "テスト用の PostgreSQL を起動する(初めてのときは、image の取得に時間がかかる)。\n",
);

const started = await startTestPostgres();

if (started._tag === "Started") {
  await prepareTestTemplate({ logger: stdoutLogger });
} else {
  const output = started._tag === "ComposeFailed" ? started.output : "";

  process.stderr.write(`${output}${FAILURE_MESSAGES[started._tag]}\n`);
  process.exitCode = 1;
}
