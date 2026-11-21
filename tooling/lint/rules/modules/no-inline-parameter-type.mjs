const typeArgumentParams = (node) => {
  const typeArguments = node?.typeArguments ?? node?.typeParameters;

  if (!typeArguments) {
    return [];
  }

  if (Array.isArray(typeArguments)) {
    return typeArguments;
  }

  if (Array.isArray(typeArguments.params)) {
    return typeArguments.params;
  }

  return [];
};

const PARAMETER_FUNCTIONS = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSCallSignatureDeclaration",
  "TSConstructorType",
  "TSConstructSignatureDeclaration",
  "TSFunctionType",
  "TSMethodSignature",
]);

const OBJECT_WRAPPERS = new Set(["Partial", "Readonly", "Required"]);

const parameterType = (param) => {
  if (param?.type === "AssignmentPattern") {
    return param.typeAnnotation?.typeAnnotation ?? parameterType(param.left);
  }

  if (param?.type === "RestElement") {
    return (
      param.typeAnnotation?.typeAnnotation ?? parameterType(param.argument)
    );
  }

  return param?.typeAnnotation?.typeAnnotation;
};

const isInlineObjectType = (typeNode) => {
  if (typeNode?.type === "TSTypeLiteral") {
    return true;
  }

  if (typeNode?.type !== "TSTypeReference") {
    return false;
  }

  const name =
    typeNode.typeName?.type === "Identifier"
      ? typeNode.typeName.name
      : undefined;

  if (!OBJECT_WRAPPERS.has(name)) {
    return false;
  }

  const [argument] = typeArgumentParams(typeNode);

  return argument?.type === "TSTypeLiteral";
};

const noInlineParameterType = {
  meta: {
    type: "problem",
    docs: {
      description:
        "関数の引数に、インラインのオブジェクト型を書くことを禁止する。",
    },
    schema: [],
    messages: {
      inlineType:
        "関数のオブジェクト引数は名前付きの型にしてください。インラインのオブジェクト型は書かないでください。",
    },
  },
  /** 関数の形をした構文ごとに、引数の型を調べる。 */
  create(context) {
    return {
      ":function, TSFunctionType, TSCallSignatureDeclaration, TSConstructorType, TSConstructSignatureDeclaration, TSMethodSignature"(
        node,
      ) {
        if (!PARAMETER_FUNCTIONS.has(node.type)) {
          return;
        }

        for (const param of node.params ?? []) {
          const annotation = parameterType(param);

          if (!isInlineObjectType(annotation)) {
            continue;
          }

          context.report({
            node: param.typeAnnotation ?? param.left?.typeAnnotation ?? param,
            messageId: "inlineType",
          });
        }
      },
    };
  },
};

export default noInlineParameterType;
