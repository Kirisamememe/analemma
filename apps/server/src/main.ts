import { createExternalApp, createInternalApp } from "./app";
import type { AppContext } from "./context";
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
const context: AppContext = {
  clock: systemClock,
  db: database.db,
  logger: stdoutLogger,
  relyingParty: env.relyingParty,
  challenges: createChallengeStore({
    capacity: CHALLENGE_CAPACITY,
    lifetimeMs: CHALLENGE_LIFETIME_MS,
  }),
};
const external = Bun.serve({
  fetch: createExternalApp(context).fetch,
  port: env.port,
});

resources.defer(async () => external.stop());

const internal = Bun.serve({
  fetch: createInternalApp(context).fetch,
  port: env.internal.port,
  hostname: env.internal.host,
});

resources.defer(async () => internal.stop());

const stopRequested = new Promise<NodeJS.Signals>((resolve) => {
  process.once("SIGINT", resolve);
  process.once("SIGTERM", resolve);
});

stdoutLogger.write({
  level: "info",
  message: "Analemma を起動した",
  details: {
    port: external.port,
    internalPort: internal.port,
    internalHost: env.internal.host,
  },
});

const signal = await stopRequested;

stdoutLogger.write({
  level: "info",
  message: "Analemma を止める",
  details: { signal },
});
