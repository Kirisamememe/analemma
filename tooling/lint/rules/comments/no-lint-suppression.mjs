const DISABLE_DIRECTIVE =
  /^\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?(?=\s|$)/v;

const noLintSuppression = {
  meta: {
    type: "problem",
    docs: {
      description: "lint を抑制するコメントを禁止する。",
    },
    schema: [],
    messages: {
      suppressed:
        "lint を抑制するコメントは書けません。まず設計を見直します。それでも当たるなら、抑制せずに、ルールに無理が無いかをユーザーに報告します。ユーザーと決めて特定のファイルでルールを外すときは、ルールを外すファイルの一覧(tooling/lint/config/rule-exemptions.ts)に足します。",
    },
  },
  /** ファイルごとに、lint を抑制するコメントを調べる。 */
  create(context) {
    return {
      "Program:exit"() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (DISABLE_DIRECTIVE.test(comment.value)) {
            context.report({ loc: comment.loc, messageId: "suppressed" });
          }
        }
      },
    };
  },
};

export default noLintSuppression;
