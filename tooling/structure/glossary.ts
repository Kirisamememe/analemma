/** 用語集の「機械で探す語」に挙げた表記と、それを探す範囲。 */
export type BannedTerm = {
  /** 探す表記。 */
  readonly term: string;
  /** 代わりに書くもの。 */
  readonly replacement: string;
  /** 探すフォルダのパス。 */
  readonly scopes: readonly string[];
  /** 探さないフォルダのパス。 */
  readonly excludes: readonly string[];
};

/** 用語集を読んだ結果。 */
export type Glossary = {
  /** 機械で探す表記。 */
  readonly banned: readonly BannedTerm[];
  /** 用語集の表の形の誤り。 */
  readonly problems: readonly string[];
};

/** Markdown の1つの表。 */
type Table = {
  /** 見出しの行のセル。 */
  readonly header: readonly string[];
  /** 見出しより下の行のセル。 */
  readonly rows: string[][];
};

/** 表を読んだ結果と、その誤り。 */
type Parsed<T> = {
  /** 読んだもの。 */
  readonly values: T[];
  /** 表の形の誤り。 */
  readonly problems: string[];
};

const MACHINE_HEADER = "表記|代わりに書くもの|探す範囲|除く範囲";
const WHOLE_REPOSITORY = "リポジトリ全体";
const NONE = "—";
const SEPARATOR_ROW = /^\|(?:\s*:?-+:?\s*\|)+$/v;

const splitCells = (line: string): string[] =>
  line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());

const splitItems = (cell: string): string[] =>
  cell === NONE
    ? []
    : cell
        .split("、")
        .map((item) => item.trim())
        .filter((item) => item !== "");

const stripCode = (item: string): string => item.replaceAll("`", "");

const readTables = (markdown: string): Parsed<Table> => {
  const lines = markdown.split("\n").map((line) => line.trim());
  const parsed: Parsed<Table> = { values: [], problems: [] };
  let current: Table | undefined;

  for (const [index, line] of lines.entries()) {
    const next = lines[index + 1] ?? "";

    if (!line.startsWith("|")) {
      current = undefined;
    } else if (SEPARATOR_ROW.test(next)) {
      current = { header: splitCells(line), rows: [] };
      parsed.values.push(current);

      if (splitCells(next).length !== current.header.length) {
        parsed.problems.push(`区切りの行の列の数が見出しと合わない:${line}`);
      }
    } else if (current === undefined) {
      parsed.problems.push(`表の外にある行:${line}`);
    } else if (!SEPARATOR_ROW.test(line)) {
      current.rows.push(splitCells(line));
    }
  }

  return parsed;
};

const machineTerms = (rows: readonly string[][]): Parsed<BannedTerm> => {
  const parsed: Parsed<BannedTerm> = { values: [], problems: [] };

  for (const [
    termCell = "",
    replacement = "",
    scopeCell = "",
    excludeCell = "",
  ] of rows) {
    const scopes =
      scopeCell === WHOLE_REPOSITORY
        ? []
        : splitItems(scopeCell).map((scope) => stripCode(scope));
    const excludes = splitItems(excludeCell).map((exclude) =>
      stripCode(exclude),
    );

    if (replacement === "" || replacement === NONE) {
      parsed.problems.push(`代わりに書くものが空:${termCell}`);
    }

    if (scopeCell !== WHOLE_REPOSITORY && scopes.length === 0) {
      parsed.problems.push(`探す範囲が空:${termCell}`);
    }

    parsed.problems.push(
      ...scopes
        .filter((scope) => !scope.endsWith("/"))
        .map((scope) => `探す範囲は / で終わるフォルダにする:${scope}`),
      ...excludes
        .filter((exclude) => !exclude.endsWith("/"))
        .map((exclude) => `除く範囲は / で終わるフォルダにする:${exclude}`),
    );
    parsed.values.push(
      ...splitItems(termCell).map((term) => ({
        term,
        replacement,
        scopes,
        excludes,
      })),
    );
  }

  return parsed;
};

/** 用語集の Markdown から、「機械で探す語」の表を読む。 */
export const readGlossary = (markdown: string): Glossary => {
  const tables = readTables(markdown);
  const machineTables = tables.values.filter(
    (table) => table.header.join("|") === MACHINE_HEADER,
  );
  const rows = machineTables.flatMap((table) => table.rows);
  const columns = MACHINE_HEADER.split("|").length;
  const machine = machineTerms(rows.filter((row) => row.length === columns));

  return {
    banned: machine.values,
    problems: [
      ...tables.problems,
      ...(machineTables.length === 0
        ? [`見出しが「${MACHINE_HEADER}」の表が無い`]
        : []),
      ...rows
        .filter((row) => row.length !== columns)
        .map((row) => `列の数が見出しと合わない行:${row.join(" | ")}`),
      ...machine.problems,
    ],
  };
};
