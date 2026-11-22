import { posix } from "node:path";
import { parseSync } from "oxc-parser";

import type { SourceFile } from "./source-file";

/** テストとテストの部品だけが import できるフォルダ。 */
export const TEST_ONLY_DIRECTORIES = [
  "apps/server/src/test-client/",
  "apps/server/src/platform/test-database/",
  "apps/admin/src/testing/",
];

const TEST_SIDE_DIRECTORIES = ["/__tests__/", "/__stories__/", "/.storybook/"];

/** story と Storybook の設定だけが import できるもの(色と文字の見本と、story のファイル)。 */
const STORY_ONLY = ["apps/admin/src/ui/specimens/", "/__stories__/"];

const isInside = (path: string): boolean =>
  TEST_ONLY_DIRECTORIES.some((directory) => `${path}/`.startsWith(directory));

const isStoryOnly = (path: string): boolean =>
  STORY_ONLY.some((part) => `${path}/`.includes(part));

const isTestSide = (path: string): boolean =>
  TEST_SIDE_DIRECTORIES.some((directory) => path.includes(directory)) ||
  isInside(path);

/** テストと story の外のファイルが、テストと story だけのものから import している先を返す。 */
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
    .filter((target) => isInside(target) || isStoryOnly(target));
};
