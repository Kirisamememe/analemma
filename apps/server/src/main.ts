import { createExternalApp, createInternalApp } from "./app";
import type { AppContext } from "./context";
import {
  CHALLENGE_CAPACITY,
  CHALLENGE_LIFETIME_MS,
  createChallengeStore,
} from "./features/auth/challenge/create-challenge-store";
import { chooseFirstListener } from "./platform/choose-first-listener";
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
const internalOptions = {
  fetch: createInternalApp(context).fetch,
  port: env.internal.port,
  hostname: env.internal.host,
};
const externalOptions = {
  fetch: createExternalApp(context).fetch,
  port: env.port,
};
const { external, internal } =
  chooseFirstListener({ external: env.port, internal: env.internal.port }) ===
  "external"
    ? {
        external: Bun.serve(externalOptions),
        internal: Bun.serve(internalOptions),
      }
    : {
        internal: Bun.serve(internalOptions),
        external: Bun.serve(externalOptions),
      };

resources.defer(async () => {
  await Promise.all([internal.stop(), external.stop()]);
});

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
