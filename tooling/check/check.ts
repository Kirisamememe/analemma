import { join } from "node:path";
import { parseArgs } from "node:util";

import { findChangedFiles } from "./changed-files";
import { buildCommands, readIgnorePatterns } from "./commands";
import { decideTestScope } from "./test-scope";

const repoRoot = join(import.meta.dirname, "../..");

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: { all: { type: "boolean", default: false } },
  strict: true,
});
const scope = decideTestScope({
  all: values.all,
  changedFiles: findChangedFiles(repoRoot),
});
const bunfig: unknown = Bun.TOML.parse(
  await Bun.file(join(repoRoot, "bunfig.toml")).text(),
);

if (scope === "without-server") {
  process.stdout.write(
    "apps/server/・packages/・compose.yaml に触れていないので、server のテスト(DB を使うものを含む)は流さない。全部流すには --all を付ける(CI は全部流す)。\n",
  );
}

const failed = buildCommands(scope, readIgnorePatterns(bunfig)).find(
  (command) => {
    process.stdout.write(`$ ${command.join(" ")}\n`);

    return (
      Bun.spawnSync(command, {
        cwd: repoRoot,
        stdio: ["inherit", "inherit", "inherit"],
      }).exitCode !== 0
    );
  },
);

if (failed !== undefined) {
  process.exitCode = 1;
}
