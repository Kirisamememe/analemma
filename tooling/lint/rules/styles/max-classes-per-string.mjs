const CLASS_ATTRIBUTE = /^(?:class|className|.+ClassName)$/v;
const CLASS_VARIABLE = /.+ClassNames?$/v;
const CLASS_PROPERTIES = new Set(["class", "className"]);
const CLASS_CALLEES = new Set(["tv", "merge"]);

const stringValue = (node) => {
  if (node.type === "Literal") {
    return typeof node.value === "string" ? node.value : undefined;
  }

  return node.type === "TemplateLiteral"
    ? node.quasis.map((part) => part.value.cooked).join("")
    : undefined;
};

const countClasses = (value) => value.split(/\s+/v).filter(Boolean).length;

const isClassAttribute = (node) =>
  node?.type === "JSXAttribute" &&
  node.name.type === "JSXIdentifier" &&
  CLASS_ATTRIBUTE.test(node.name.name);

const propertyName = (node) => {
  if (node.computed) {
    return undefined;
  }

  return node.key.type === "Identifier" ? node.key.name : node.key.value;
};

const isClassVariable = (node) =>
  node.type === "Identifier" && CLASS_VARIABLE.test(node.name);

const VALUE_CONTAINERS = new Set([
  "ArrayExpression",
  "JSXExpressionContainer",
  "ObjectExpression",
  "TSAsExpression",
  "TSSatisfiesExpression",
]);

const carriesValue = (parent, child) =>
  VALUE_CONTAINERS.has(parent.type) ||
  (parent.type === "SpreadElement" &&
    parent.parent.type === "ArrayExpression") ||
  (parent.type === "Property" && parent.value === child) ||
  (parent.type === "ConditionalExpression" && parent.test !== child) ||
  (parent.type === "LogicalExpression" &&
    (parent.operator !== "&&" || parent.right === child)) ||
  (parent.type === "BinaryExpression" && parent.operator === "+");

const contextOf = (node) => {
  let child = node;

  for (let parent = node.parent; parent; parent = parent.parent) {
    if (isClassAttribute(parent)) {
      return "attribute";
    }

    if (
      (parent.type === "CallExpression" &&
        parent.callee !== child &&
        parent.callee.type === "Identifier" &&
        CLASS_CALLEES.has(parent.callee.name)) ||
      (parent.type === "Property" &&
        parent.value === child &&
        CLASS_PROPERTIES.has(propertyName(parent))) ||
      (parent.type === "VariableDeclarator" &&
        parent.init === child &&
        isClassVariable(parent.id)) ||
      (parent.type === "AssignmentPattern" &&
        parent.right === child &&
        isClassVariable(parent.left))
    ) {
      return "array";
    }

    if (!carriesValue(parent, child)) {
      return undefined;
    }

    child = parent;
  }

  return undefined;
};

const maxClassesPerString = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "class の文字列(className の属性・tv と merge の引数・className のプロパティ)の、1つの文字列に書ける class の数を限る。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        required: ["max"],
        properties: {
          max: { type: "integer", minimum: 1 },
        },
      },
    ],
    messages: {
      attribute:
        "className の文字列に class が {{count}} 個あります({{max}} 個まで)。tv に移し、配列で意味のまとまり(並べ方・箱・色・状態など)ごとの文字列に分けます。",
      array:
        "1つの文字列に class が {{count}} 個あります({{max}} 個まで)。配列にし、意味のまとまり(並べ方・箱・色・状態など)ごとの文字列に分けます。",
    },
  },
  /** class の文字列ごとに、class の数を数える。 */
  create(context) {
    const [{ max }] = context.options;

    const check = (node) => {
      const value = stringValue(node);

      if (value === undefined) {
        return;
      }

      const count = countClasses(value);

      if (count <= max) {
        return;
      }

      const messageId = contextOf(node);

      if (messageId !== undefined) {
        context.report({ node, messageId, data: { count, max } });
      }
    };

    return {
      Literal: check,
      TemplateLiteral: check,
    };
  },
};

export default maxClassesPerString;
