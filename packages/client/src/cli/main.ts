import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { runCli } from "./run-cli";

const loadModule = async (path: string): Promise<unknown> =>
  import(pathToFileURL(resolve(path)).href);

process.exitCode = await runCli({
  args: process.argv.slice(2),
  url: process.env["ANALEMMA_URL"],
  token: process.env["ANALEMMA_DEPLOY_TOKEN"],
  loadModule,
  fetch: async (request) => fetch(request),
  write: (line) => {
    process.stdout.write(`${line}\n`);
  },
  writeError: (line) => {
    process.stderr.write(`${line}\n`);
  },
});
