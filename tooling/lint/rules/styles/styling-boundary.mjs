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

const PLAIN_ARIA_PROPS = new Map([["useDrop", new Set(["dropProps"])]]); // 見た目の props を返さないと確かめた、hook と値

const READ_ONLY_USES = new Set(["JSXSpreadAttribute", "SpreadElement"]);

const isStyleKey = (key) => key === "style" || CLASS_ATTRIBUTE.test(key);

const findVariable = (scope, name) => {
  for (let current = scope; current !== null; current = current.upper) {
    const variable = current.set.get(name);

    if (variable !== undefined) {
      return { variable, scope: current };
    }
  }

  return undefined;
};

const ariaHookName = (init, scope) => {
  if (init?.type !== "CallExpression" || init.callee.type !== "Identifier") {
    return undefined;
  }

  const [definition] =
    findVariable(scope, init.callee.name)?.variable.defs ?? [];

  if (
    definition?.type !== "ImportBinding" ||
    !ARIA_LIBRARIES.has(definition.parent.source.value) ||
    definition.node.type !== "ImportSpecifier"
  ) {
    return undefined;
  }

  const { imported } = definition.node;

  return imported.type === "Identifier" ? imported.name : imported.value;
};

const destructuredKey = (pattern, name) => {
  const property = pattern.properties.find(
    (candidate) =>
      candidate.type === "Property" &&
      candidate.value.type === "Identifier" &&
      candidate.value.name === name,
  );

  return property === undefined ? undefined : propertyKey(property);
};

const isOnlySpread = (variable, declared) =>
  variable.references.every(
    ({ identifier }) =>
      identifier === declared || READ_ONLY_USES.has(identifier.parent.type),
  );

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

  const found = findVariable(scope, node.name);
  const [definition] = found?.variable.defs ?? [];

  if (definition?.type !== "Variable" || definition.parent.kind !== "const") {
    return false;
  }

  const { id, init } = definition.node;

  if (!isOnlySpread(found.variable, definition.name)) {
    return false;
  }

  if (id.type === "ObjectPattern") {
    const hook = ariaHookName(init, found.scope);
    const key = destructuredKey(id, node.name);

    return PLAIN_ARIA_PROPS.get(hook)?.has(key) === true;
  }

  return (
    init !== null &&
    init.type !== "Identifier" &&
    isPlainProps(init, found.scope)
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
        "画面のコードでは式の className と style を止め、ui/ では className を検査できる形に、style を CSS 変数だけに限る。どちらでも、中身を検査できない JSX の props の spread を止める。",
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
        "JSX の props に spread できるのは、その場か同じファイルの const に書いて書き換えない、className・style・…ClassName を含まないオブジェクトと、見た目の props を返さないと確かめた React Aria の hook の値だけです。中身を検査できない値を渡すと、className や style が検査をすり抜けます。",
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
