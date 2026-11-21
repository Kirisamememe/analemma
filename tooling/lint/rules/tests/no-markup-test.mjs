import { isTestFile } from "./files.mjs";

const TEST_ID_QUERY = /^(?:get|query|find)(?:All)?ByTestId$/v;

const DOM_TRAVERSAL = new Set([
  "closest",
  "getElementsByClassName",
  "getElementsByTagName",
  "querySelector",
  "querySelectorAll",
]);

const MARKUP_PROPERTIES = new Set([
  "className",
  "classList",
  "innerHTML",
  "outerHTML",
]);

const MARKUP_MATCHERS = new Set([
  "toContainHTML",
  "toHaveClass",
  "toHaveStyle",
  "toMatchInlineSnapshot",
  "toMatchSnapshot",
  "toThrowErrorMatchingInlineSnapshot",
  "toThrowErrorMatchingSnapshot",
]);

const calleeName = (callee) => {
  if (callee.type === "Identifier") {
    return callee.name;
  }

  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }

  return "";
};

const noMarkupTest = {
  meta: {
    type: "problem",
    docs: {
      description:
        "テストで、マークアップの作りに依存する探し方と確かめ方を禁止する。",
    },
    schema: [],
    messages: {
      testId:
        "{{name}} は使いません。role・label・text など、利用者に見えるもので要素を探します。",
      domTraversal:
        "{{name}} でマークアップをたどらないでください。role・label・text など、利用者に見えるもので要素を探します。",
      markupProperty:
        "{{name}} を確かめないでください。マークアップの作りではなく、利用者に見える結果を確かめます。",
      markupMatcher:
        "{{name}} は使いません。マークアップの作りをなぞらず、利用者に見える結果を確かめます。",
    },
  },
  /** テストのファイルごとに、マークアップに依存する探し方と確かめ方を探す。 */
  create(context) {
    if (!isTestFile(context.filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        const name = calleeName(node.callee);

        if (TEST_ID_QUERY.test(name)) {
          context.report({ node, messageId: "testId", data: { name } });
        } else if (DOM_TRAVERSAL.has(name)) {
          context.report({ node, messageId: "domTraversal", data: { name } });
        } else if (MARKUP_MATCHERS.has(name)) {
          context.report({ node, messageId: "markupMatcher", data: { name } });
        }
      },
      MemberExpression(node) {
        if (
          node.property.type === "Identifier" &&
          MARKUP_PROPERTIES.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: "markupProperty",
            data: { name: node.property.name },
          });
        }
      },
    };
  },
};

export default noMarkupTest;
