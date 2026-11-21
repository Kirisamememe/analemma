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
        "管理画面の画面のコードに、式の className と style を書かせず、ui/ の className を検査できる形に、style を CSS 変数だけにし、JSX の props の spread を止める。",
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
        "JSX の props は spread しません。className や style が、検査をすり抜けて渡るため。props を1つずつ書きます。",
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
        context.report({ node, messageId: "spread" });
      },
    };
  },
};

export default stylingBoundary;
