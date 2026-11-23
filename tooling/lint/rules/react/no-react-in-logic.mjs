import { basename } from "node:path";

const REACT_MODULE = /^react(?:-dom)?(?:\/|$)/v;
const HOOK_FILE = /^use-.+\.ts$/v;
const HOOK_NAME = /^use[A-Z]/v;

const FUNCTIONS = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

const TYPE_DECLARATIONS = new Set([
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
]);

const isTypeOnly = (node) =>
  node.importKind === "type" ||
  node.exportKind === "type" ||
  (node.specifiers?.length > 0 &&
    node.specifiers.every(
      (specifier) =>
        specifier.importKind === "type" || specifier.exportKind === "type",
    ));

const isReactValueSource = (node) =>
  typeof node.source?.value === "string" &&
  REACT_MODULE.test(node.source.value) &&
  !isTypeOnly(node);

const nameOf = (node) => (node.type === "Identifier" ? node.name : node.value);

const reactBindings = (program) => {
  const createContexts = new Set();
  const namespaces = new Set();

  for (const statement of program.body) {
    if (
      statement.type !== "ImportDeclaration" ||
      statement.source.value !== "react" ||
      statement.importKind === "type"
    ) {
      continue;
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type !== "ImportSpecifier") {
        namespaces.add(specifier.local.name);
      } else if (
        specifier.importKind !== "type" &&
        nameOf(specifier.imported) === "createContext"
      ) {
        createContexts.add(specifier.local.name);
      }
    }
  }

  return { createContexts, namespaces };
};

const isCreateContext = (node, { createContexts, namespaces }) => {
  if (node?.type !== "CallExpression") {
    return false;
  }

  const { callee } = node;

  if (callee.type === "Identifier") {
    return createContexts.has(callee.name);
  }

  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    namespaces.has(callee.object.name) &&
    callee.property.type === "Identifier" &&
    callee.property.name === "createContext"
  );
};

const kindOf = (node, bindings) => {
  if (FUNCTIONS.has(node?.type)) {
    return "function";
  }

  return isCreateContext(node, bindings) ? "context" : "value";
};

const localKinds = (program, bindings) => {
  const kinds = new Map();

  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration"
        ? statement.declaration
        : statement;

    if (declaration?.type === "FunctionDeclaration" && declaration.id) {
      kinds.set(declaration.id.name, "function");
    }

    if (declaration?.type !== "VariableDeclaration") {
      continue;
    }

    for (const declarator of declaration.declarations) {
      if (declarator.id.type === "Identifier") {
        kinds.set(declarator.id.name, kindOf(declarator.init, bindings));
      }
    }
  }

  return kinds;
};

const declaredExports = (declaration, kinds) => {
  if (TYPE_DECLARATIONS.has(declaration.type)) {
    return [];
  }

  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations.map((declarator) => ({
      name: declarator.id.type === "Identifier" ? declarator.id.name : "",
      kind:
        declarator.id.type === "Identifier"
          ? (kinds.get(declarator.id.name) ?? "value")
          : "value",
    }));
  }

  return [
    {
      name: declaration.id?.name ?? "",
      kind: declaration.type === "FunctionDeclaration" ? "function" : "value",
    },
  ];
};

const valueExports = (statement, { kinds, bindings }) => {
  if (statement.type === "ExportAllDeclaration") {
    return isTypeOnly(statement) ? [] : [{ name: "*", kind: "unknown" }];
  }

  if (statement.type === "ExportDefaultDeclaration") {
    const { declaration } = statement;

    const kind =
      declaration.type === "Identifier"
        ? (kinds.get(declaration.name) ?? "value")
        : kindOf(declaration, bindings);

    return [{ name: "default", kind }];
  }

  if (statement.type !== "ExportNamedDeclaration" || isTypeOnly(statement)) {
    return [];
  }

  if (statement.declaration) {
    return declaredExports(statement.declaration, kinds);
  }

  return statement.specifiers
    .filter((specifier) => specifier.exportKind !== "type")
    .map((specifier) => ({
      name: nameOf(specifier.exported),
      kind: statement.source
        ? "unknown"
        : (kinds.get(nameOf(specifier.local)) ?? "value"),
    }));
};

const exportsOf = (program) => {
  const bindings = reactBindings(program);
  const kinds = localKinds(program, bindings);

  return program.body.flatMap((statement) =>
    valueExports(statement, { kinds, bindings }),
  );
};

const isHookFile = (filename, exported) => {
  const functions = exported.filter(
    ({ kind }) => kind === "function" || kind === "unknown",
  );

  return (
    HOOK_FILE.test(basename(filename)) &&
    functions.length === 1 &&
    functions[0].kind === "function" &&
    HOOK_NAME.test(functions[0].name)
  );
};

const isContextFile = (filename, exported) =>
  filename.endsWith("-context.ts") &&
  exported.length > 0 &&
  exported.every(({ kind }) => kind === "context");

const noReactInLogic = {
  meta: {
    type: "problem",
    docs: {
      description:
        "React の値を import できる .ts を、hook のファイルと context のファイルに限る。",
    },
    schema: [],
    messages: {
      reactInLogic:
        "React の値を import できる `.ts` は、hook のファイル(名前が `use-` で始まり、export する関数は1つだけで、名前は `use` で始まる)と、context のファイル(名前が `-context.ts` で終わり、値として export するのは `createContext` の結果だけで、少なくとも1つは export する)です。ほかの `.ts` で React の型を使うときは `import type` で読みます。",
    },
  },
  /** .ts のファイルの、React の値の import を調べる。 */
  create(context) {
    const { filename } = context;

    if (!filename.endsWith(".ts") || filename.endsWith(".d.ts")) {
      return {};
    }

    const imports = [];

    const remember = (node) => {
      if (isReactValueSource(node)) {
        imports.push(node);
      }
    };

    return {
      ImportDeclaration: remember,
      ExportNamedDeclaration: remember,
      ExportAllDeclaration: remember,
      "Program:exit"(program) {
        if (imports.length === 0) {
          return;
        }

        const exported = exportsOf(program);

        if (
          isHookFile(filename, exported) ||
          isContextFile(filename, exported)
        ) {
          return;
        }

        for (const node of imports) {
          context.report({ node, messageId: "reactInLogic" });
        }
      },
    };
  },
};

export default noReactInLogic;
