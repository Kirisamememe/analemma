const LINE_BREAK_CHARACTERS = new Set(["\n", "\r", "\u2028", "\u2029"]);
const LINE_BREAK = /\r\n|[\n\r\u2028\u2029]/v;
const NOT_LINE_BREAK = /[^\n\r\u2028\u2029]/gv;

const blankOutComments = ({ comments, text }) => {
  let blanked = "";
  let cursor = 0;

  for (const comment of comments.toSorted(
    (left, right) => left.start - right.start,
  )) {
    blanked += text.slice(cursor, comment.start);
    blanked += text
      .slice(comment.start, comment.end)
      .replaceAll(NOT_LINE_BREAK, " ");
    cursor = comment.end;
  }

  return blanked + text.slice(cursor);
};

/** 空行とコメントだけの行を除いて、コードの行を数える。 */
export const countCodeLines = ({ comments, text }) =>
  blankOutComments({ comments, text })
    .split(LINE_BREAK)
    .filter((line) => line.trim() !== "").length;

/** ある位置を含む行の、先頭の位置を返す。 */
export const lineStartOf = (text, index) => {
  for (let position = index - 1; position >= 0; position -= 1) {
    if (LINE_BREAK_CHARACTERS.has(text[position])) {
      return position + 1;
    }
  }

  return 0;
};
