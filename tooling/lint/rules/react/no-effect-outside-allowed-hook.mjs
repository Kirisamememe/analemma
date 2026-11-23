const EFFECTS = new Set(["useEffect", "useLayoutEffect", "useInsertionEffect"]);
const REACT_OBJECT = Symbol("React");

const FUNCTIONS = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

const importName = (specifier) => {
  if (specifier.type !== "ImportSpecifier") {
    return REACT_OBJECT;
  }

  if (specifier.importKind === "type") {
    return undefined;
  }

  const { imported } = specifier;
  const name = imported.type === "Identifier" ? imported.name : imported.value;

  return name === "default" ? REACT_OBJECT : name;
};

const reactImportReferences = (sourceCode) => {
  const references = new Map();

  for (const declaration of sourceCode.ast.body) {
    if (
      declaration.type !== "ImportDeclaration" ||
      declaration.importKind === "type" ||
      declaration.source.value !== "react"
    ) {
      continue;
    }

    for (const specifier of declaration.specifiers) {
      const name = importName(specifier);

      if (name !== REACT_OBJECT && !EFFECTS.has(name)) {
        continue;
      }

      for (const variable of sourceCode.getDeclaredVariables(specifier)) {
        for (const { identifier } of variable.references) {
          references.set(identifier, name);
        }
      }
    }
  }

  return references;
};

const effectName = (callee, references) => {
  if (callee.type === "Identifier") {
    const name = references.get(callee);

    return EFFECTS.has(name) ? name : undefined;
  }

  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    EFFECTS.has(callee.property.name) &&
    references.get(callee.object) === REACT_OBJECT
  ) {
    return callee.property.name;
  }

  return undefined;
};

const functionName = (node) => {
  if (node?.type === "FunctionDeclaration") {
    return node.id?.name;
  }

  const parent = node?.parent;

  return parent?.type === "VariableDeclarator" &&
    parent.parent?.kind === "const" &&
    parent.init === node &&
    parent.id.type === "Identifier"
    ? parent.id.name
    : undefined;
};

const noEffectOutsideAllowedHook = {
  meta: {
    type: "problem",
    docs: {
      description:
        "React の effect を、`allowedHooks` に挙げた hook の直下に限る。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          allowedHooks: { type: "array", items: { type: "string" } },
        },
      },
    ],
    messages: {
      outsideAllowedHook:
        "React の `{{effect}}` は、`ADMIN_EFFECT_HOOKS` にある hook の直下でだけ呼べます。effect が必要なら、目的が分かる名前の hook を作り、`tooling/lint/config/admin-overrides.ts` の `ADMIN_EFFECT_HOOKS` と、`apps/admin/DECISIONS.md` の「React の effect」の hook の表に足します。どうしても避けられない場合は、理由を書いてこの診断を抑制します。",
    },
  },
  /** React の effect を呼ぶ場所を調べる。 */
  create(context) {
    const { sourceCode } = context;
    const references = reactImportReferences(sourceCode);
    const allowedHooks = new Set(context.options[0]?.allowedHooks ?? []);

    if (references.size === 0) {
      return {};
    }

    return {
      CallExpression(node) {
        const effect = effectName(node.callee, references);

        if (effect === undefined) {
          return;
        }

        const enclosing = sourceCode
          .getAncestors(node)
          .findLast((ancestor) => FUNCTIONS.has(ancestor.type));

        if (!allowedHooks.has(functionName(enclosing))) {
          context.report({
            node: node.callee,
            messageId: "outsideAllowedHook",
            data: { effect },
          });
        }
      },
    };
  },
};

export default noEffectOutsideAllowedHook;
