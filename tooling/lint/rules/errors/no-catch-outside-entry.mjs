const noCatchOutsideEntry = {
  meta: {
    type: "problem",
    docs: {
      description:
        "入口と dispatcher の外で、try/catch と `.catch()` で失敗を受け止めることを禁止する。",
    },
    schema: [],
    messages: {
      tryCatch:
        "try/catch は、入口と dispatcher でだけ書けます。想定内の失敗は `_tag` 付きの判別共用体で返し、想定外の失敗は throw して、入口で 500 とログにします。",
      catchMethod:
        "`.catch()` は、入口と dispatcher でだけ書けます。想定内の失敗は `_tag` 付きの判別共用体で返し、想定外の失敗は throw して、入口で 500 とログにします。",
    },
  },
  /** catch 節と、`.catch()` の呼び出しを探す。 */
  create(context) {
    return {
      CatchClause(node) {
        context.report({ node, messageId: "tryCatch" });
      },
      CallExpression(node) {
        const { callee } = node;

        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          callee.property.name === "catch"
        ) {
          context.report({ node: callee.property, messageId: "catchMethod" });
        }
      },
    };
  },
};

export default noCatchOutsideEntry;
