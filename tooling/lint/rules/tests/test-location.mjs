import { dirname, sep } from "node:path";

import { isTestFile } from "./files.mjs";

const TESTS_DIRECTORY = "__tests__";

const testLocation = {
  meta: {
    type: "problem",
    docs: {
      description:
        "テストのファイルを __tests__ に置かせ、__tests__ にはテストのファイルだけを置かせる。",
    },
    schema: [],
    messages: {
      testOutside:
        "テストのファイルは、テストするコードと同じフォルダの __tests__ に置きます。",
      nonTestInside:
        "__tests__ にはテストのファイルだけを置きます。テストで使う関数やデータは、使う側のフォルダに置きます。",
      nestedInTests:
        "__tests__ の中にフォルダを作らないでください。テストは、テストするコードと同じフォルダの __tests__ の直下に置きます。",
    },
  },
  /** ファイルごとに、テストのファイルと __tests__ の置き場所を調べる。 */
  create(context) {
    const directories = dirname(context.filename).split(sep);
    const inTestsDirectory = directories.at(-1) === TESTS_DIRECTORY;
    const nested = !inTestsDirectory && directories.includes(TESTS_DIRECTORY);
    const testFile = isTestFile(context.filename);

    const messageId = nested
      ? "nestedInTests"
      : testFile && !inTestsDirectory
        ? "testOutside"
        : !testFile && inTestsDirectory
          ? "nonTestInside"
          : "";

    if (messageId === "") {
      return {};
    }

    return {
      Program(node) {
        context.report({ node, messageId });
      },
    };
  },
};

export default testLocation;
