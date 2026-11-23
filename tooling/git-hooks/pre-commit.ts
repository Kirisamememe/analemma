import { loadPrivateNames } from "../structure/private-name-list";
import { findPrivateNames } from "../structure/private-names";
import { readStagedFiles } from "./staged-files";

const repository = process.cwd();
const names = loadPrivateNames(repository);
const staged = names.length === 0 ? [] : readStagedFiles(repository);

const problems = [
  ...staged.flatMap(({ path }) =>
    findPrivateNames({ names, text: path }).map(
      ({ name }) => `${path}: パスに「${name}」`,
    ),
  ),
  ...staged.flatMap(({ path, text }) =>
    findPrivateNames({ names, text }).map(
      ({ line, name }) => `${path}:${String(line)}: 「${name}」`,
    ),
  ),
];

if (problems.length > 0) {
  process.stderr.write(
    `ステージしたファイルに、ほかのリポジトリの名前があります。直してからコミットしてください。\n${problems.join("\n")}\n`,
  );
  process.exitCode = 1;
}
