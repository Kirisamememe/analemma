import { readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { collectExportedFunctions } from "../modules/exported-functions.mjs";
import { isTestFile } from "./files.mjs";

const LOGIC_FILE = /\.([cm]?ts)$/v;
const TEST_CALL = /\b(?:test|it)(?:\.each)?\s*\(/v;

const hasTests = (paths) =>
  paths.some(
    (path) =>
      statSync(path, { throwIfNoEntry: false })?.isFile() === true &&
      TEST_CALL.test(readFileSync(path, "utf8")),
  );

const testFilesFor = (filename) =>
  [filename.match(LOGIC_FILE)?.[1] ?? "ts", "tsx"].map((extension) =>
    join(
      dirname(filename),
      "__tests__",
      basename(filename).replace(/\.[^.]+$/v, `.test.${extension}`),
    ),
  );

const testNames = (paths) => paths.map((path) => basename(path)).join(" か ");

const requireSiblingTest = {
  meta: {
    type: "problem",
    docs: {
      description:
        "関数を export する .ts に、同じフォルダの __tests__ のテストのファイルを求める。",
    },
    schema: [],
    messages: {
      missingLogicTest:
        "このファイルは関数を export しています。同じフォルダの __tests__ に {{test}} を置き、ロジックのテストを書きます。",
    },
  },
  /** ファイルごとに、__tests__ のテストのファイルが要るかを調べる。 */
  create(context) {
    const { filename } = context;

    if (
      filename.endsWith(".d.ts") ||
      isTestFile(filename) ||
      !LOGIC_FILE.test(filename)
    ) {
      return {};
    }

    const testFiles = testFilesFor(filename);

    return {
      "Program:exit"(program) {
        if (
          collectExportedFunctions(program).size > 0 &&
          !hasTests(testFiles)
        ) {
          context.report({
            node: program,
            messageId: "missingLogicTest",
            data: { test: testNames(testFiles) },
          });
        }
      },
    };
  },
};

export default requireSiblingTest;
