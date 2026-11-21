const DIRECTIVE =
  /^\s*(?:(?:oxlint|eslint)-(?:disable|enable)(?:-next-line|-line)?(?:\s|$)|@ts-(?:expect-error|ignore|nocheck|check)(?:\s|$)|[#@]__(?:PURE|NO_SIDE_EFFECTS)__\s*$)/v;

/** lint や型検査への指示として書くコメントを見分ける。 */
export const isDirective = (comment) => DIRECTIVE.test(comment.value);

/** TSDoc のブロックコメントを見分ける。 */
export const isTsdoc = (comment) =>
  comment.type === "Block" &&
  comment.value.startsWith("*") &&
  !comment.value.startsWith("**");
