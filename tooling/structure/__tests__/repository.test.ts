import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import config from "../../../oxlint.config";
import {
  RULE_EXEMPTION_OVERRIDES,
  RULE_EXEMPTIONS,
} from "../../lint/config/rule-exemptions";
import { findMissingRerenderExpectations } from "../admin/rerender-expectations";
import { findStrayStoryFiles } from "../admin/story-files";
import {
  DIRECTORY_ENTRY_LIMIT,
  findBadDirectories,
  findCrowdedDirectories,
} from "../directories";
import { readGlossary } from "../glossary";
import { findBannedTerms } from "../glossary-search";
import { loadPrivateNames } from "../private-name-list";
import { findPrivateNames } from "../private-names";
import { extractProse, hasProse } from "../prose";
import {
  HARD_LIMIT,
  LONG_FILES,
  PROTECTED_RULES,
  SOFT_LIMIT,
  SOFT_LIMIT_RULE,
  checkSourceFile,
} from "../source-file";
import { findTestOnlyImports } from "../test-only-imports";

const repoRoot = join(import.meta.dirname, "../../..");
const INTENTIONALLY_BROKEN = "tooling/lint/fixtures/invalid/";

const listed = spawnSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { cwd: repoRoot, encoding: "utf8" },
);

const paths = listed.stdout
  .split("\0")
  .filter(
    (path) =>
      path !== "" &&
      !path.startsWith(INTENTIONALLY_BROKEN) &&
      existsSync(join(repoRoot, path)),
  );

test("リポジトリのファイルの一覧を取れること", () => {
  expect(listed.status).toBe(0);
  expect(paths.length).toBeGreaterThan(0);
});

test(`どのフォルダも、中身が ${String(DIRECTORY_ENTRY_LIMIT)} 件以内であること`, () => {
  expect(
    findCrowdedDirectories({ limit: DIRECTORY_ENTRY_LIMIT, paths }),
  ).toEqual([]);
});

test("フォルダの名前が kebab-case であること", () => {
  expect(findBadDirectories(paths)).toEqual([]);
});

test("server の `*.query.ts` は用途ごとの `queries/` に置くこと", () => {
  expect(
    paths.filter(
      (path) =>
        path.startsWith("apps/server/src/") &&
        path.endsWith(".query.ts") &&
        path.split("/").at(-2) !== "queries",
    ),
  ).toEqual([]);
});

test("__stories__ には story のファイルだけを置くこと", () => {
  expect(findStrayStoryFiles(paths)).toEqual([]);
});

const DECISIONS_FILE = /(?:^|\/)DECISIONS\.md$/v;
const SECTION_HEADING = /^## .*$/gmv;

test("どの DECISIONS.md も、「割り切ったこと」の見出しで終わること", () => {
  const decisions = paths.filter((path) => DECISIONS_FILE.test(path));

  const lastSections = decisions.map((path) => ({
    path,
    section: readFileSync(join(repoRoot, path), "utf8")
      .match(SECTION_HEADING)
      ?.at(-1),
  }));

  expect(decisions.length).toBeGreaterThan(0);
  expect(
    lastSections.filter(({ section }) => section !== "## 割り切ったこと"),
  ).toEqual([]);
});

const SOURCE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/v;
const SKIPPED_BY_OXLINT = /[.\-]min\.(?:[cm]?[jt]s|[jt]sx)$/v;

const OXLINT_CONFIG =
  /(?:^|\/)(?:\.oxlintrc\.jsonc?|oxlint\.config\.[cm]?[jt]s)$/v;

const sourcePaths = paths.filter((path) => SOURCE_FILE.test(path));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const severityOf = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

/** 設定から読み出すルールのオプション。 */
type OptionQuery = {
  /** オプションの名前。 */
  readonly name: string;
  /** 設定に書いたルールの値。 */
  readonly value: unknown;
};

const optionOf = ({ name, value }: OptionQuery): unknown =>
  Array.isArray(value) && isRecord(value[1]) ? value[1][name] : undefined;

const rules: Readonly<Record<string, unknown>> = config.rules;
const { overrides } = config;
const exemptionOverrides: readonly unknown[] = RULE_EXEMPTION_OVERRIDES;

test("どのソースのファイルも、抑制のコメントに左右されない約束を守っていること", () => {
  const problems = sourcePaths.flatMap((path) =>
    checkSourceFile({
      path,
      text: readFileSync(join(repoRoot, path), "utf8"),
    }).map((problem) => `${path}: ${problem}`),
  );

  expect(problems).toEqual([]);
});

test("テストの外のファイルが、テストだけのフォルダから import していないこと", () => {
  expect(
    sourcePaths.flatMap((path) =>
      findTestOnlyImports({
        path,
        text: readFileSync(join(repoRoot, path), "utf8"),
      }).map((target) => `${path}: ${target}`),
    ),
  ).toEqual([]);
});

const ADMIN = "apps/admin/";

const readAdmin = (candidates: readonly string[]) =>
  candidates
    .filter((path) => path.startsWith(ADMIN))
    .map((path) => ({
      path,
      text: readFileSync(join(repoRoot, path), "utf8"),
    }));

test("管理画面の state を持つ feature・部品・画面が、再レンダリングの期待を書いていること", () => {
  expect(
    findMissingRerenderExpectations({
      sources: readAdmin(sourcePaths),
      documents: readAdmin(paths.filter((path) => DECISIONS_FILE.test(path))),
    }),
  ).toEqual([]);
});

test("Oxlint が飛ばす名前のソースのファイルが無いこと", () => {
  expect(sourcePaths.filter((path) => SKIPPED_BY_OXLINT.test(path))).toEqual(
    [],
  );
});

test("Oxlint の設定はリポジトリの直下の1つだけであること", () => {
  expect(paths.filter((path) => OXLINT_CONFIG.test(path))).toEqual([
    "oxlint.config.ts",
  ]);
});

test("守るべきルールを、設定で弱めていないこと", () => {
  const guarded = [...PROTECTED_RULES, SOFT_LIMIT_RULE];

  const overridden = overrides
    .filter((override: unknown) => !exemptionOverrides.includes(override))
    .flatMap((override: unknown) =>
      isRecord(override) && isRecord(override["rules"])
        ? Object.keys(override["rules"]).filter((rule) =>
            guarded.includes(rule),
          )
        : [],
    );

  expect(guarded.map((rule) => severityOf(rules[rule]))).toEqual(
    guarded.map(() => "error"),
  );
  expect(overridden).toEqual([]);
});

test("ルールを外すファイルの一覧が、外せないルールを外さず、今あるファイルだけを挙げていること", () => {
  expect(
    RULE_EXEMPTIONS.filter(({ rule }) => PROTECTED_RULES.includes(rule)),
  ).toEqual([]);
  expect(
    RULE_EXEMPTIONS.flatMap(({ files }) => files).filter(
      (file) => !paths.includes(file),
    ),
  ).toEqual([]);
  expect(RULE_EXEMPTIONS.filter(({ reason }) => reason.trim() === "")).toEqual(
    [],
  );
});

test("400行を超えてよいと挙げたファイルが、今も400行を超えていること", () => {
  expect(
    [...LONG_FILES].filter(
      (path) =>
        !checkSourceFile(
          { path, text: readFileSync(join(repoRoot, path), "utf8") },
          new Set(),
        ).some((problem) =>
          problem.includes("ルールを外すファイルの一覧に無い"),
        ),
    ),
  ).toEqual([]);
});

test("lint とこの検査で、行数の境目がそろっていること", () => {
  expect([
    optionOf({ name: "max", value: rules[SOFT_LIMIT_RULE] }),
    optionOf({ name: "max", value: rules["project/file-length-limit"] }),
    optionOf({
      name: "dividerRequiredAfter",
      value: rules["project/no-standalone-comment"],
    }),
  ]).toEqual([SOFT_LIMIT, HARD_LIMIT, SOFT_LIMIT]);
});

const GLOSSARY = "GLOSSARY.md";
const glossary = readGlossary(readFileSync(join(repoRoot, GLOSSARY), "utf8"));

test("用語集の表を読めて、探す範囲と除く範囲のフォルダがあること", () => {
  const missingScopes = glossary.banned
    .flatMap(({ excludes, scopes }) => [...scopes, ...excludes])
    .filter((scope) => !paths.some((path) => path.startsWith(scope)));

  expect(glossary.problems).toEqual([]);
  expect(glossary.banned.length).toBeGreaterThan(0);
  expect(missingScopes).toEqual([]);
});

test("文書・コメント・文字列に、用語集で使わない表記が無いこと", () => {
  const extracted = paths
    .filter((path) => path !== GLOSSARY && hasProse(path))
    .map((path) => ({
      path,
      file: extractProse({
        path,
        text: readFileSync(join(repoRoot, path), "utf8"),
      }),
    }));

  const unreadable = extracted.flatMap(({ file, path }) =>
    file.errors.map((error) => `${path}: ${error}`),
  );

  const findings = extracted.flatMap(({ file, path }) =>
    findBannedTerms({ glossary, path, prose: file.prose }).map(
      ({ line, replacement, term }) =>
        `${path}:${String(line)}: 「${term}」→ ${replacement}`,
    ),
  );

  expect(unreadable).toEqual([]);
  expect(findings).toEqual([]);
});

test("用語集で探す表記が、別の概念を指す正しい文を落とさないこと", () => {
  const sentences = [
    "データベースに接続できない",
    "記事のプリント用スタイル",
    "利用規約を確認する",
    "DNS の TXT レコードを足す",
    "CSRF トークンを確かめる",
    "入力フィールドのイベントハンドラ",
    "SSE のイベント ID で再開する",
    "HTTP クライアントとメールサーバー",
    "ヘルスチェックのエンドポイント",
    "端末の画面ロック機能",
    "消印と札幌と改札",
    "Codex のレビューで指摘された箇所",
    "安定版が出たら、Debian 版の image に上げる",
  ];

  const prose = sentences.map((text, index) => ({ text, line: index + 1 }));

  expect(
    ["apps/server/a.ts", "packages/contract/a.ts", "tooling/a.ts"].flatMap(
      (path) => findBannedTerms({ glossary, path, prose }),
    ),
  ).toEqual([]);
});

test("ほかのリポジトリの名前を、どのファイルにも書いていないこと", () => {
  const names = loadPrivateNames(repoRoot);

  const searched =
    names.length === 0
      ? []
      : listed.stdout
          .split("\0")
          .filter((path) => path !== "" && existsSync(join(repoRoot, path)));

  const inPaths = searched.flatMap((path) =>
    findPrivateNames({ names, text: path }).map(
      ({ name }) => `${path}: パスに「${name}」`,
    ),
  );

  const inFiles = searched.flatMap((path) =>
    findPrivateNames({
      names,
      text: readFileSync(join(repoRoot, path), "utf8"),
    }).map(({ line, name }) => `${path}:${String(line)}: 「${name}」`),
  );

  expect([...inPaths, ...inFiles]).toEqual([]);
});

const WORKFLOW = /^\.github\/workflows\/[^\/]+\.ya?ml$/v;
const USES = /^\s*(?:-\s+)?uses:\s*(?<action>.*)$/gmv;
const PINNED_ACTION = /^[\w.\-]+\/[\w.\-\/]+@[0-9a-f]{40} # v\d+(?:\.\d+)*$/v;
const TOP_LEVEL_PERMISSIONS = /^permissions:/mv;

const workflows = paths
  .filter((path) => WORKFLOW.test(path))
  .map((path) => ({
    path,
    text: readFileSync(join(repoRoot, path), "utf8"),
  }));

test("workflow の actions を、コミットの SHA で固定し、行末にバージョンを書いていること", () => {
  expect(workflows.length).toBeGreaterThan(0);
  expect(
    workflows.flatMap(({ path, text }) =>
      [...text.matchAll(USES)]
        .map(({ groups }) => groups?.["action"] ?? "")
        .filter((action) => !PINNED_ACTION.test(action))
        .map((action) => `${path}: ${action}`),
    ),
  ).toEqual([]);
});

test("どの workflow も、最上位で permissions を決めていること", () => {
  expect(
    workflows
      .filter(({ text }) => !TOP_LEVEL_PERMISSIONS.test(text))
      .map(({ path }) => path),
  ).toEqual([]);
});
