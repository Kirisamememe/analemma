const EXPRESSION_WRAPPERS = new Set([
  "ChainExpression",
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSInstantiationExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);

const unwrapExpression = (node) => {
  let current = node;

  while (current && EXPRESSION_WRAPPERS.has(current.type)) {
    current = current.expression;
  }

  return current;
};

const isFunction = (node) => {
  const expression = unwrapExpression(node);

  return (
    expression?.type === "ArrowFunctionExpression" ||
    expression?.type === "FunctionDeclaration" ||
    expression?.type === "FunctionExpression"
  );
};

const rememberFunction = ({ functions, name, node }) => {
  if (name && node && !functions.has(name)) {
    functions.set(name, node);
  }
};

const rememberFunctionDeclarators = ({ functions, declaration }) => {
  for (const declarator of declaration.declarations) {
    if (declarator.id.type === "Identifier" && isFunction(declarator.init)) {
      rememberFunction({
        functions,
        name: declarator.id.name,
        node: declarator,
      });
    }
  }
};

const collectLocalFunctions = (program) => {
  const functions = new Map();

  for (const statement of program.body) {
    if (statement.type === "FunctionDeclaration") {
      rememberFunction({
        functions,
        name: statement.id?.name,
        node: statement,
      });
      continue;
    }

    if (statement.type === "VariableDeclaration") {
      rememberFunctionDeclarators({ functions, declaration: statement });
      continue;
    }

    if (
      statement.type !== "ExportNamedDeclaration" ||
      statement.source ||
      !statement.declaration
    ) {
      continue;
    }

    const declaration = statement.declaration;

    if (declaration.type === "FunctionDeclaration") {
      rememberFunction({
        functions,
        name: declaration.id?.name,
        node: declaration,
      });
      continue;
    }

    if (declaration.type === "VariableDeclaration") {
      rememberFunctionDeclarators({ functions, declaration });
    }
  }

  return functions;
};

const addExportedFunction = (exported, node) => {
  if (node) {
    exported.add(node);
  }
};

const collectNamedExports = ({ exported, functions, statement }) => {
  if (statement.source) {
    return;
  }

  if (statement.declaration?.type === "FunctionDeclaration") {
    addExportedFunction(exported, statement.declaration);

    return;
  }

  if (statement.declaration?.type === "VariableDeclaration") {
    for (const declarator of statement.declaration.declarations) {
      if (declarator.id.type === "Identifier" && isFunction(declarator.init)) {
        addExportedFunction(exported, declarator);
      }
    }

    return;
  }

  for (const specifier of statement.specifiers) {
    const name =
      specifier.local?.type === "Identifier" ? specifier.local.name : undefined;

    addExportedFunction(exported, name ? functions.get(name) : undefined);
  }
};

/** ファイルが export する関数の構文ノードを集める。 */
export const collectExportedFunctions = (program) => {
  const functions = collectLocalFunctions(program);
  const exported = new Set();

  for (const statement of program.body) {
    if (statement.type === "ExportNamedDeclaration") {
      collectNamedExports({ exported, functions, statement });
      continue;
    }

    if (statement.type !== "ExportDefaultDeclaration") {
      continue;
    }

    const declaration = unwrapExpression(statement.declaration);

    if (declaration?.type === "Identifier") {
      addExportedFunction(exported, functions.get(declaration.name));
      continue;
    }

    if (isFunction(declaration)) {
      addExportedFunction(exported, declaration);
    }
  }

  return exported;
};
