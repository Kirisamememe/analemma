const MAX_OPERATORS = 1;
const MAX_STATEMENTS = 2;

const JSX = new Set(["JSXElement", "JSXFragment"]);
const FUNCTIONS = new Set(["ArrowFunctionExpression", "FunctionExpression"]);

const isNode = (value) =>
  typeof value === "object" && value !== null && typeof value.type === "string";

const childrenOf = (node) =>
  Object.entries(node).flatMap(([key, value]) => {
    if (key === "parent") {
      return [];
    }

    return (Array.isArray(value) ? value : [value]).filter((child) =>
      isNode(child),
    );
  });

const containsJsx = (node) =>
  JSX.has(node.type) || childrenOf(node).some((child) => containsJsx(child));

const COMPARISONS = new Set([
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "in",
  "instanceof",
]);

const isOperator = (node) =>
  node.type === "LogicalExpression" ||
  (node.type === "BinaryExpression" && COMPARISONS.has(node.operator)) ||
  (node.type === "UnaryExpression" && node.operator === "!");

const countOperators = (node) => {
  if (JSX.has(node.type)) {
    return 0;
  }

  return childrenOf(node).reduce(
    (count, child) => count + countOperators(child),
    isOperator(node) ? 1 : 0,
  );
};

const STATEMENT_LISTS = ["body", "consequent", "cases"];
const NESTED_STATEMENTS = ["alternate", "block", "handler", "finalizer"];

const countStatements = (node) => {
  if (FUNCTIONS.has(node.type) || node.type === "FunctionDeclaration") {
    return 0;
  }

  const own = /(?:Statement|Declaration)$/v.test(node.type) ? 1 : 0;

  const nested = [...STATEMENT_LISTS, ...NESTED_STATEMENTS]
    .flatMap((key) => node[key] ?? [])
    .filter((child) => isNode(child))
    .reduce((count, child) => count + countStatements(child), 0);

  return node.type === "BlockStatement" ? nested : own + nested;
};

const isRenderedChild = (node) =>
  node.parent.type === "JSXExpressionContainer" &&
  JSX.has(node.parent.parent.type);

const isBranch = (node) =>
  node.parent.type === "ConditionalExpression" && node.parent.test !== node;

const isCondition = (node) =>
  containsJsx(node.right) ||
  (node.operator === "&&" && (isRenderedChild(node) || isBranch(node)));

const noJsxLogic = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "JSX の中に、込み入った条件・出し分けの入れ子・長い関数を書かせない。",
    },
    schema: [],
    messages: {
      complexCondition:
        "JSX の中の出し分けの条件に、演算子が{{count}}つあります。1つまでにし、込み入った条件は、名前を付けた値か logic/ の関数にします。",
      nestedCondition:
        "JSX の中で、出し分けを入れ子にしています。内側を別の部品にするか、名前を付けた値や関数に出します。",
      longFunction:
        "JSX の中の関数に、文が{{count}}つあります(if やループの中の文も数えます)。2つまでにし、長い処理は hook か関数にします。",
    },
  },
  /** JSX の式の中にある、出し分けと関数を調べる。 */
  create(context) {
    let expressions = 0;
    let conditions = 0;

    const enterCondition = (node, test) => {
      if (expressions === 0) {
        return;
      }

      const count = countOperators(test);

      if (count > MAX_OPERATORS) {
        context.report({
          node: test,
          messageId: "complexCondition",
          data: { count: String(count) },
        });
      }

      if (conditions > 0) {
        context.report({ node, messageId: "nestedCondition" });
      }

      conditions += 1;
    };

    const leaveCondition = () => {
      if (expressions > 0) {
        conditions -= 1;
      }
    };

    const checkFunction = (node) => {
      if (expressions === 0 || node.body.type !== "BlockStatement") {
        return;
      }

      const count = countStatements(node.body);

      if (count > MAX_STATEMENTS) {
        context.report({
          node,
          messageId: "longFunction",
          data: { count: String(count) },
        });
      }
    };

    return {
      JSXExpressionContainer() {
        expressions += 1;
      },
      "JSXExpressionContainer:exit"() {
        expressions -= 1;
      },
      JSXSpreadAttribute() {
        expressions += 1;
      },
      "JSXSpreadAttribute:exit"() {
        expressions -= 1;
      },
      ConditionalExpression(node) {
        enterCondition(node, node.test);
      },
      "ConditionalExpression:exit": leaveCondition,
      LogicalExpression(node) {
        if (isCondition(node)) {
          enterCondition(node, node.left);
        }
      },
      "LogicalExpression:exit"(node) {
        if (isCondition(node)) {
          leaveCondition();
        }
      },
      ArrowFunctionExpression: checkFunction,
      FunctionExpression: checkFunction,
    };
  },
};

export default noJsxLogic;
