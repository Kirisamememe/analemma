const HEADING = "## 割り切ったこと";
const LINE_BREAK = /\r?\n/v;
const FENCE = /^(?:```|~~~)/v;
const SECTION_END = /^#{1,2} /v;

/** 読み進めている場所。 */
type Cursor = {
  /** コードのブロックの中か。 */
  readonly inFence: boolean;
  /** 「割り切ったこと」の節の中か。 */
  readonly inSection: boolean;
  /** 節の中で集めた行。 */
  readonly lines: readonly string[];
  /** 節の見出しを見つけたか。 */
  readonly found: boolean;
};

const START: Cursor = {
  inFence: false,
  inSection: false,
  lines: [],
  found: false,
};

const step = (cursor: Cursor, line: string): Cursor => {
  if (FENCE.test(line)) {
    return {
      ...cursor,
      inFence: !cursor.inFence,
      lines: cursor.inSection ? [...cursor.lines, line] : cursor.lines,
    };
  }

  if (!cursor.inFence && line === HEADING) {
    return { ...cursor, inSection: true, found: true };
  }

  if (!cursor.inFence && SECTION_END.test(line)) {
    return { ...cursor, inSection: false };
  }

  return cursor.inSection
    ? { ...cursor, lines: [...cursor.lines, line] }
    : cursor;
};

/** `DECISIONS.md` の「## 割り切ったこと」の節の中身を取り出す。 */
export const extractTradeOffs = (markdown: string): string | undefined => {
  const { found, lines } = markdown
    .split(LINE_BREAK)
    .reduce<Cursor>((cursor, line) => step(cursor, line), START);

  return found ? lines.join("\n").trim() : undefined;
};
