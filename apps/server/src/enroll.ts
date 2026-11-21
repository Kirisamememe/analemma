import { issueEnrollment } from "./features/auth/enrollment/issue-enrollment";
import { systemClock } from "./platform/clock";
import { openDatabase } from "./platform/database";
import { readEnv } from "./platform/env";
import { type Logger, formatLogLine } from "./platform/logger";

const stderrLogger: Logger = {
  write: (entry) => {
    process.stderr.write(formatLogLine(entry));
  },
};

const env = readEnv();

await using database = openDatabase({
  target: env.database,
  logger: stderrLogger,
  max: 1,
});

const issued = await issueEnrollment({
  db: database.db,
  origin: env.relyingParty.origin,
  now: systemClock.now(),
});

stderrLogger.write({
  level: "info",
  message: "登録用 URL を出した",
  details: {
    enrollmentId: issued.enrollmentId,
    expiresAt: issued.expiresAt.toISOString(),
  },
});
process.stderr.write(
  `パスキーの登録用 URL を出した。${issued.expiresAt.toISOString()} まで、1回だけ使える。前に出した登録用 URL があれば、それは使えなくなった。\n`,
);
process.stdout.write(`${issued.url}\n`);
