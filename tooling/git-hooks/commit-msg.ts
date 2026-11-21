import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { readGlossary } from "../structure/glossary";
import { loadPrivateNames } from "../structure/private-name-list";
import { findMessageProblems, stripComments } from "./commit-message";

const repoRoot = join(import.meta.dirname, "../..");
const COMMITLINT = join(repoRoot, "node_modules/@commitlint/cli/cli.js");
const DEFAULT_COMMENT_CHAR = "#";
const repository = process.cwd();

const readCommentChar = (): string => {
  const configured = spawnSync("git", ["config", "--get", "core.commentChar"], {
    cwd: repository,
    encoding: "utf8",
  }).stdout.trim();

  return configured === "" || configured === "auto"
    ? DEFAULT_COMMENT_CHAR
    : configured;
};

const [messageFile] = process.argv.slice(2);

if (messageFile === undefined) {
  process.stderr.write(
    "コミットのメッセージのファイルのパスを渡してください。\n",
  );
  process.exitCode = 2;
} else {
  const format = spawnSync(
    process.execPath,
    [COMMITLINT, "--edit", resolve(messageFile)],
    { cwd: repoRoot, stdio: "inherit" },
  );
  const problems = findMessageProblems({
    glossary: readGlossary(readFileSync(join(repoRoot, "GLOSSARY.md"), "utf8")),
    names: loadPrivateNames(repository),
    message: {
      path: messageFile,
      text: stripComments({
        commentChar: readCommentChar(),
        raw: readFileSync(resolve(messageFile), "utf8"),
      }),
    },
  });

  if (problems.length > 0) {
    process.stderr.write(
      `コミットのメッセージに、ほかのリポジトリの名前か、用語集で使わない表記があります。\n${problems.join("\n")}\n`,
    );
  }

  if (format.status !== 0 || problems.length > 0) {
    process.exitCode = 1;
  }
}
