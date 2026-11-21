const noDynamicImport = {
  meta: {
    type: "problem",
    docs: {
      description: "`import()` による動的な import を禁止する。",
    },
    schema: [],
    messages: {
      dynamicImport:
        "`import()` は使えません。境界を守る `no-restricted-imports` は動的な import を見ないので、import 文で読み込みます。",
    },
  },
  /** `import()` の式を探す。 */
  create(context) {
    return {
      ImportExpression(node) {
        context.report({ node, messageId: "dynamicImport" });
      },
    };
  },
};

export default noDynamicImport;
