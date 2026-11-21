import { isDirective } from "./comment-kinds.mjs";

const DIVIDER_LINE = /^\s*-{10,}\s*$/v;
const HAS_WORD = /[\p{L}\p{N}]/v;

const isLineComment = (comment) => comment?.type === "Line";

const isDividerLine = (comment) =>
  isLineComment(comment) && DIVIDER_LINE.test(comment.value);

const isTitle = (comment) =>
  isLineComment(comment) &&
  !isDirective(comment) &&
  HAS_WORD.test(comment.value);

const isNextLine = (before, after) =>
  after.loc.start.line === before.loc.start.line + 1;

/** 罫線・見出しの行・罫線の3行でできた、分割の見出しを集める。 */
export const findSectionDividers = (comments) => {
  const dividers = [];

  for (const [index, top] of comments.entries()) {
    const title = comments[index + 1];
    const bottom = comments[index + 2];

    if (
      isDividerLine(top) &&
      isTitle(title) &&
      isDividerLine(bottom) &&
      isNextLine(top, title) &&
      isNextLine(title, bottom)
    ) {
      dividers.push({ bottom, title, top });
    }
  }

  return dividers;
};
