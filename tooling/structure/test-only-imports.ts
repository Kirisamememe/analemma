import { posix } from "node:path";
import { parseSync } from "oxc-parser";

import type { SourceFile } from "./source-file";

/** テストとテストの部品だけが import できるフォルダ。 */
export const TEST_ONLY_DIRECTORIES = [
  "apps/server/src/test-client/",
  "apps/server/src/platform/test-database/",
];

const TEST_DIRECTORY = "/__tests__/";

const isInside = (path: string): boolean =>
  TEST_ONLY_DIRECTORIES.some((directory) => `${path}/`.startsWith(directory));

const isTestSide = (path: string): boolean =>
  path.includes(TEST_DIRECTORY) || isInside(path);

/** テストの外のファイルが、テストだけのフォルダから import している先を返す。 */
export const findTestOnlyImports = ({ path, text }: SourceFile): string[] => {
  if (isTestSide(path)) {
    return [];
  }

  const { module } = parseSync(path, text);
  const requests = [
    ...module.staticImports.map(({ moduleRequest }) => moduleRequest.value),
    ...module.staticExports.flatMap(({ entries }) =>
      entries.flatMap(({ moduleRequest }) =>
        moduleRequest === null ? [] : [moduleRequest.value],
      ),
    ),
  ];

  return requests
    .filter((request) => request.startsWith("."))
    .map((request) => posix.join(posix.dirname(path), request))
    .filter((target) => isInside(target));
};
