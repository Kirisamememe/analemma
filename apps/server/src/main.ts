import { createApp } from "./app";
import {
  CHALLENGE_CAPACITY,
  CHALLENGE_LIFETIME_MS,
  createChallengeStore,
} from "./features/auth/challenge/create-challenge-store";
import { systemClock } from "./platform/clock";
import { openDatabase } from "./platform/database";
import { readEnv } from "./platform/env";
import { stdoutLogger } from "./platform/logger";

const env = readEnv();

await using resources = new AsyncDisposableStack();

const database = resources.use(
  openDatabase({ target: env.database, logger: stdoutLogger }),
);
const app = createApp({
  clock: systemClock,
  db: database.db,
  logger: stdoutLogger,
  relyingParty: env.relyingParty,
  challenges: createChallengeStore({
    capacity: CHALLENGE_CAPACITY,
    lifetimeMs: CHALLENGE_LIFETIME_MS,
  }),
});
const server = Bun.serve({ fetch: app.fetch, port: env.port });

resources.defer(async () => server.stop());

const stopRequested = new Promise<NodeJS.Signals>((resolve) => {
  process.once("SIGINT", resolve);
  process.once("SIGTERM", resolve);
});

stdoutLogger.write({
  level: "info",
  message: "Analemma を起動した",
  details: { port: server.port },
});

const signal = await stopRequested;

stdoutLogger.write({
  level: "info",
  message: "Analemma を止める",
  details: { signal },
});
