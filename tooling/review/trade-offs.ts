const HEADING = "## 割り切ったこと";
const LINE_BREAK = /\r?\n/v;
const FENCE = /^(?:```|~~~)/v;
const SECTION_END = /^#{1,2} /v;

/** 読み進めている場所。 */
type ScanState = {
  /** コードのブロックの中か。 */
  readonly inFence: boolean;
  /** 「割り切ったこと」の節の中か。 */
  readonly inSection: boolean;
  /** 節の中で集めた行。 */
  readonly lines: readonly string[];
  /** 節の見出しを見つけたか。 */
  readonly found: boolean;
};

const START: ScanState = {
  inFence: false,
  inSection: false,
  lines: [],
  found: false,
};

const step = (state: ScanState, line: string): ScanState => {
  if (FENCE.test(line)) {
    return {
      ...state,
      inFence: !state.inFence,
      lines: state.inSection ? [...state.lines, line] : state.lines,
    };
  }

  if (!state.inFence && line === HEADING) {
    return { ...state, inSection: true, found: true };
  }

  if (!state.inFence && SECTION_END.test(line)) {
    return { ...state, inSection: false };
  }

  return state.inSection ? { ...state, lines: [...state.lines, line] } : state;
};

/** `DECISIONS.md` の「## 割り切ったこと」の節の中身を取り出す。 */
export const extractTradeOffs = (markdown: string): string | undefined => {
  const { found, lines } = markdown
    .split(LINE_BREAK)
    .reduce<ScanState>((state, line) => step(state, line), START);

  return found ? lines.join("\n").trim() : undefined;
};
