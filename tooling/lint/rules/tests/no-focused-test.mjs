import { isTestFile } from "./files.mjs";

const TEST_FUNCTIONS = new Set(["describe", "it", "test"]);

const NOT_RUN = new Set([
  "failing",
  "if",
  "only",
  "skip",
  "skipIf",
  "todo",
  "todoIf",
]);

const noFocusedTest = {
  meta: {
    type: "problem",
    docs: {
      description:
        "テストの一部だけを走らせる指定と、走らせない指定を禁止する。",
    },
    schema: [],
    messages: {
      notRun:
        "{{name}} を残さないでください。一部のテストだけを走らせたり飛ばしたりすると、check が通っても仕様が守られているとは限らなくなります。",
    },
  },
  /** テストのファイルごとに、`only`・`skip`・`if` などの指定を探す。 */
  create(context) {
    if (!isTestFile(context.filename)) {
      return {};
    }

    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          TEST_FUNCTIONS.has(node.object.name) &&
          node.property.type === "Identifier" &&
          NOT_RUN.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: "notRun",
            data: { name: `${node.object.name}.${node.property.name}` },
          });
        }
      },
    };
  },
};

export default noFocusedTest;
