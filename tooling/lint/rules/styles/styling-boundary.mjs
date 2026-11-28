const CLASS_ATTRIBUTE = /^(?:class|className|.+ClassName)$/v;

const attributeName = (node) =>
  node.name.type === "JSXIdentifier" ? node.name.name : undefined;

const isStaticString = (value) => {
  if (value === null) {
    return true;
  }

  if (value.type === "Literal") {
    return typeof value.value === "string";
  }

  if (value.type !== "JSXExpressionContainer") {
    return false;
  }

  const { expression } = value;

  return (
    (expression.type === "Literal" && typeof expression.value === "string") ||
    (expression.type === "TemplateLiteral" &&
      expression.expressions.length === 0)
  );
};

const propertyKey = (property) => {
  if (property.type !== "Property" || property.computed) {
    return undefined;
  }

  if (property.key.type === "Literal") {
    return String(property.key.value);
  }

  return property.key.type === "Identifier" ? property.key.name : undefined;
};

const ARIA_LIBRARIES = new Set([
  "react-aria",
  "react-aria-components",
  "react-stately",
]);

const isStyleKey = (key) => key === "style" || CLASS_ATTRIBUTE.test(key);

const findVariable = (scope, name) => {
  for (let current = scope; current !== null; current = current.upper) {
    const variable = current.set.get(name);

    if (variable !== undefined) {
      return variable;
    }
  }

  return undefined;
};

const isAriaHookCall = (init, scope) => {
  if (init?.type !== "CallExpression" || init.callee.type !== "Identifier") {
    return false;
  }

  const [definition] = findVariable(scope, init.callee.name)?.defs ?? [];

  return (
    definition?.type === "ImportBinding" &&
    ARIA_LIBRARIES.has(definition.parent.source.value)
  );
};

const isPlainProps = (node, scope) => {
  if (node.type === "ConditionalExpression") {
    return (
      isPlainProps(node.consequent, scope) &&
      isPlainProps(node.alternate, scope)
    );
  }

  if (node.type === "ObjectExpression") {
    return node.properties.every((property) => {
      if (property.type === "SpreadElement") {
        return isPlainProps(property.argument, scope);
      }

      const key = propertyKey(property);

      return key !== undefined && !isStyleKey(key);
    });
  }

  if (node.type !== "Identifier") {
    return false;
  }

  const [definition] = findVariable(scope, node.name)?.defs ?? [];

  if (definition?.type !== "Variable" || definition.parent.kind !== "const") {
    return false;
  }

  const { id, init } = definition.node;

  if (id.type === "ObjectPattern") {
    return isAriaHookCall(init, scope);
  }

  return (
    init !== null && init.type !== "Identifier" && isPlainProps(init, scope)
  );
};

const isCheckedExpression = (expression) =>
  expression.type === "CallExpression" ||
  (expression.type === "ArrowFunctionExpression" &&
    expression.body.type === "CallExpression");

const isCheckedClassName = (value) => {
  if (isStaticString(value)) {
    return true;
  }

  return (
    value.type === "JSXExpressionContainer" &&
    isCheckedExpression(value.expression)
  );
};

const checkScreen = (context, node) => {
  const name = attributeName(node);

  if (name === "style") {
    context.report({ node, messageId: "styleOutsideUi" });
  } else if (
    name !== undefined &&
    CLASS_ATTRIBUTE.test(name) &&
    !isStaticString(node.value)
  ) {
    context.report({ node, messageId: "dynamicClassName" });
  }
};

const checkUi = (context, node) => {
  const name = attributeName(node);

  if (
    name !== undefined &&
    CLASS_ATTRIBUTE.test(name) &&
    !isCheckedClassName(node.value)
  ) {
    context.report({ node, messageId: "uncheckedClassName" });

    return;
  }

  if (name !== "style") {
    return;
  }

  const expression =
    node.value?.type === "JSXExpressionContainer"
      ? node.value.expression
      : undefined;

  if (expression?.type !== "ObjectExpression") {
    context.report({ node, messageId: "styleNotObject" });

    return;
  }

  for (const property of expression.properties) {
    const key = propertyKey(property);

    if (key === undefined || !key.startsWith("--")) {
      context.report({ node: property, messageId: "styleNotCustomProperty" });
    }
  }
};

const stylingBoundary = {
  meta: {
    type: "problem",
    docs: {
      description:
        "画面のコードでは式の className と style を止め、ui/ では className を検査できる形に、style を CSS 変数だけに限る。どちらでも JSX の props の spread を止める。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        required: ["area"],
        properties: {
          area: { enum: ["screen", "ui"] },
        },
      },
    ],
    messages: {
      dynamicClassName:
        "画面のコードの className には、文字列のリテラルだけを渡します。式を渡すと、class の検査をすり抜けます。見た目を変えるときは、ui/ の部品の props を使います。",
      uncheckedClassName:
        "部品の className には、文字列のリテラルか、tv などの関数の呼び出し(render props なら、呼び出しを返す関数)を渡します。変数や条件の式を渡すと、class の検査をすり抜けます。",
      spread:
        "JSX の props に spread できるのは、同じファイルに書いた、className と style を含まないオブジェクトと、React Aria の hook が返す props だけです。受け取った props をそのまま渡すと、className や style が検査をすり抜けます。",
      styleOutsideUi:
        "style は ui/ の部品の中でだけ使います。画面のコードは、部品の props を使います。",
      styleNotObject:
        "style には、その場に書いたオブジェクトを渡します(キーを検査できるように)。",
      styleNotCustomProperty:
        "style に書けるのは、`--` で始まる CSS 変数だけです。見た目は class で書きます。",
    },
  },
  /** JSX の属性を、場所ごとの決まりで確かめる。 */
  create(context) {
    const [{ area }] = context.options;
    const check = area === "ui" ? checkUi : checkScreen;

    return {
      JSXAttribute(node) {
        check(context, node);
      },
      JSXSpreadAttribute(node) {
        const scope = context.sourceCode.getScope(node);

        if (!isPlainProps(node.argument, scope)) {
          context.report({ node, messageId: "spread" });
        }
      },
    };
  },
};

export default stylingBoundary;
