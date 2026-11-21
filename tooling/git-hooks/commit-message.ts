import type { Glossary } from "../structure/glossary";
import { findBannedTerms } from "../structure/glossary-search";
import { findPrivateNames } from "../structure/private-names";
import { LINE_BREAK } from "../structure/prose";
import type { SourceFile } from "../structure/source-file";

/** git から渡された、コメントを消す前のコミットのメッセージ。 */
export type RawCommitMessage = {
  /** メッセージのファイルの中身。 */
  readonly raw: string;
  /** git の `core.commentChar`。 */
  readonly commentChar: string;
};

/** コミットのメッセージの中を探すための入力。 */
export type MessageSearch = {
  /** メッセージのファイルのパスと、コメントを消した中身。 */
  readonly message: SourceFile;
  /** 読んだ用語集。 */
  readonly glossary: Glossary;
  /** 手元だけの一覧から読んだ名前。 */
  readonly names: readonly string[];
};

const SCISSORS = "------------------------ >8 ------------------------";

/** コミットのメッセージから、git が消すコメントの行と、scissors の行から後を消す。 */
export const stripComments = ({
  commentChar,
  raw,
}: RawCommitMessage): string => {
  const lines = raw.split(LINE_BREAK);
  const scissors = lines.indexOf(`${commentChar} ${SCISSORS}`);

  return (scissors === -1 ? lines : lines.slice(0, scissors))
    .map((line) => (line.startsWith(commentChar) ? "" : line))
    .join("\n");
};

/** コミットのメッセージから、ほかのリポジトリの名前と、用語集で使わない表記を探す。 */
export const findMessageProblems = ({
  glossary,
  message,
  names,
}: MessageSearch): string[] => [
  ...findPrivateNames({ names, text: message.text }).map(
    ({ line, name }) => `${message.path}:${String(line)}: 「${name}」`,
  ),
  ...findBannedTerms({
    glossary,
    path: "", // メッセージはどのフォルダにも属さない
    prose: [{ text: message.text, line: 1 }],
  }).map(
    ({ line, replacement, term }) =>
      `${message.path}:${String(line)}: 「${term}」→ ${replacement}`,
  ),
];
