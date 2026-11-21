import { readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { collectExportedFunctions } from "../modules/exported-functions.mjs";
import { isTestFile } from "./files.mjs";

const LOGIC_FILE = /\.([cm]?ts)$/v;
const TEST_CALL = /\b(?:test|it)(?:\.each)?\s*\(/v;

const hasTests = (path) =>
  statSync(path, { throwIfNoEntry: false })?.isFile() === true &&
  TEST_CALL.test(readFileSync(path, "utf8"));

const testFileFor = (filename, extension) =>
  join(
    dirname(filename),
    "__tests__",
    basename(filename).replace(/\.[^.]+$/v, `.test.${extension}`),
  );

const isJsx = (node) => {
  if (node?.type === "ParenthesizedExpression") {
    return isJsx(node.expression);
  }

  return node?.type === "JSXElement" || node?.type === "JSXFragment";
};

const returnsJsx = (statement) => {
  if (statement?.type === "ReturnStatement") {
    return isJsx(statement.argument);
  }

  if (statement?.type === "BlockStatement") {
    return statement.body.some(returnsJsx);
  }

  return false;
};

const branchingVisitors = (onBranch) => ({
  ConditionalExpression(node) {
    if (isJsx(node.consequent) || isJsx(node.alternate)) {
      onBranch();
    }
  },
  LogicalExpression(node) {
    if (isJsx(node.right)) {
      onBranch();
    }
  },
  IfStatement(node) {
    if (returnsJsx(node.consequent)) {
      onBranch();
    }
  },
  SwitchCase(node) {
    if (node.consequent.some(returnsJsx)) {
      onBranch();
    }
  },
});

const requireSiblingTest = {
  meta: {
    type: "problem",
    docs: {
      description:
        "ロジックの .ts と、表示を出し分けるコンポーネントに、同じフォルダの __tests__ のテストのファイルを求める。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          branchingComponents: {
            type: "boolean",
          },
        },
      },
    ],
    messages: {
      missingLogicTest:
        "このファイルは関数を export しています。同じフォルダの __tests__ に {{test}} を置き、ロジックのテストを書きます。",
      missingComponentTest:
        "このコンポーネントは表示を出し分けています。同じフォルダの __tests__ に {{test}} を置き、出し分けの結果を利用者に見えるもので確かめます。",
    },
  },
  /** ファイルごとに、__tests__ のテストのファイルが要るかを調べる。 */
  create(context) {
    const { filename } = context;
    const branchingComponents =
      context.options[0]?.branchingComponents === true;

    if (filename.endsWith(".d.ts") || isTestFile(filename)) {
      return {};
    }

    if (LOGIC_FILE.test(filename)) {
      const testFile = testFileFor(filename, filename.match(LOGIC_FILE)?.[1]);

      return {
        "Program:exit"(program) {
          if (
            collectExportedFunctions(program).size > 0 &&
            !hasTests(testFile)
          ) {
            context.report({
              node: program,
              messageId: "missingLogicTest",
              data: { test: basename(testFile) },
            });
          }
        },
      };
    }

    if (!branchingComponents || !filename.endsWith(".tsx")) {
      return {};
    }

    const testFile = testFileFor(filename, "tsx");
    let branches = false;

    return {
      ...branchingVisitors(() => {
        branches = true;
      }),
      "Program:exit"(program) {
        if (branches && !hasTests(testFile)) {
          context.report({
            node: program,
            messageId: "missingComponentTest",
            data: { test: basename(testFile) },
          });
        }
      },
    };
  },
};

export default requireSiblingTest;
