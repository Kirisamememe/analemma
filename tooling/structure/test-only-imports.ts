import { posix } from "node:path";
import { parseSync } from "oxc-parser";

import type { SourceFile } from "./source-file";

/** テストとテストの部品だけが import できる場所。 */
export const TEST_ONLY_DIRECTORIES = [
  "apps/server/src/test-client/",
  "apps/server/src/platform/test-database/",
  "apps/server/src/features/auth/webauthn/fake-authenticator/",
  "apps/server/src/features/auth/webauthn/w3c-test-vectors/",
  "apps/admin/src/testing/",
];

const TEST_SIDE_DIRECTORIES = ["/__tests__/", "/__stories__/", "/.storybook/"];
const SOURCE_EXTENSION = /\.(?:[cm]?[jt]s|[jt]sx)$/v;
const SOURCE_ALIAS = "@/";
const SOURCE_ALIAS_WORKSPACES = ["apps/admin", "apps/server"];

/** テストの側・story・Storybook の設定だけが import できるもの。 */
const STORY_ONLY = [
  "apps/admin/src/ui/specimens/",
  "/__stories__/",
  "/.storybook/",
];

const isInside = (path: string): boolean =>
  TEST_ONLY_DIRECTORIES.some((directory) => `${path}/`.startsWith(directory));

const isStoryOnly = (path: string): boolean =>
  STORY_ONLY.some((part) => `${path}/`.includes(part));

const isTestSide = (path: string): boolean =>
  TEST_SIDE_DIRECTORIES.some((directory) => path.includes(directory)) ||
  isInside(path);

const resolveLocalPath = (
  path: string,
  request: string,
): string | undefined => {
  if (request.startsWith(".")) {
    return posix.join(posix.dirname(path), request);
  }

  if (request.startsWith(SOURCE_ALIAS)) {
    const workspace = SOURCE_ALIAS_WORKSPACES.find((root) =>
      path.startsWith(`${root}/`),
    );

    if (workspace !== undefined) {
      return posix.join(workspace, "src", request.slice(SOURCE_ALIAS.length));
    }
  }

  return undefined;
};

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
    .map((request) => resolveLocalPath(path, request))
    .filter((target) => target !== undefined)
    .map((target) => target.replace(SOURCE_EXTENSION, ""))
    .filter((target) => isInside(target) || isStoryOnly(target));
};
