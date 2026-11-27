import { parseSync } from "oxc-parser";

import type { SourceFile } from "../source-file";

/** 再レンダリングの期待を書く見出し。 */
export const RERENDER_HEADING = "## 再レンダリングの期待";

const ADMIN_DECISIONS = "apps/admin/DECISIONS.md";

const UNIT =
  /^apps\/admin\/src\/(?:features|components|routes)\/(?!__)[^\/]+\//v;

const TEST_SIDE = /\/(?:__tests__|__stories__)\//v;
const SOURCE_EXTENSION = /\.tsx?$/v;
const STATE_HOOKS = new Set(["useState", "useReducer", "useSyncExternalStore"]);
const NEXT_HEADING = /^## /mv;

/** 再レンダリングの期待を調べるための入力。 */
export type RerenderCheckInput = {
  /** 管理画面の製品のコードのファイル。 */
  readonly sources: readonly SourceFile[];
  /** 管理画面の `DECISIONS.md`。 */
  readonly documents: readonly SourceFile[];
};

const unitOf = (path: string): string | undefined =>
  TEST_SIDE.test(path) || !SOURCE_EXTENSION.test(path)
    ? undefined
    : UNIT.exec(path)?.[0];

const holdsState = ({ path, text }: SourceFile): boolean =>
  parseSync(path, text).module.staticImports.some(
    ({ moduleRequest, entries }) =>
      moduleRequest.value === "react" &&
      entries.some(
        ({ importName }) =>
          importName.name !== null && STATE_HOOKS.has(importName.name),
      ),
  );

const sectionOf = (text: string): string | undefined => {
  const [, ...rest] = text.split(`${RERENDER_HEADING}\n`);
  const [body] = rest;

  return body?.split(NEXT_HEADING)[0]?.trim();
};

/** state を持つのに、再レンダリングの期待を書いていない管理画面のフォルダを集める。 */
export const findMissingRerenderExpectations = ({
  sources,
  documents,
}: RerenderCheckInput): string[] => {
  const sections = new Map(
    documents.map(({ path, text }) => [path, sectionOf(text)]),
  );

  const units = new Set(
    sources
      .filter(
        (source) => unitOf(source.path) !== undefined && holdsState(source),
      )
      .map(({ path }) => unitOf(path))
      .filter((unit) => unit !== undefined),
  );

  return [...units]
    .filter((unit) => {
      const own = `${unit}DECISIONS.md`;

      if (sections.has(own)) return (sections.get(own) ?? "") === "";

      const name = `\`${unit.replace("apps/admin/", "")}\``;

      return sections.get(ADMIN_DECISIONS)?.includes(name) !== true;
    })
    .toSorted();
};
