const DIRECTIVE = /^\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?(?=\s|$)/v;

/** コメントの本文が、lint を抑制するコメントかを見分ける。 */
export const isDisableDirective = (value: string): boolean =>
  DIRECTIVE.test(value);
