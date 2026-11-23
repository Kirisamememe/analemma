import { basename } from "node:path";

import { collectExportedFunctions } from "../modules/exported-functions.mjs";

const REACT_MODULE = /^react(?:-dom)?(?:\/|$)/v;
const HOOK_FILE = /^use-.+\.ts$/v;
const HOOK_NAME = /^use[A-Z]/v;
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

const isHookFile = (filename, program) => {
  if (!HOOK_FILE.test(basename(filename))) {
    return false;
  }

  const functions = [...collectExportedFunctions(program)];

  return (
    functions.length === 1 &&
    functions[0].id?.type === "Identifier" &&
    HOOK_NAME.test(functions[0].id.name)
  );
};

const isCreateContext = (node) =>
  node?.type === "CallExpression" &&
  ((node.callee.type === "Identifier" &&
    node.callee.name === "createContext") ||
    (node.callee.type === "MemberExpression" &&
      !node.callee.computed &&
      node.callee.property.type === "Identifier" &&
      node.callee.property.name === "createContext"));

const localInitializers = (program) => {
  const initializers = new Map();

  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration"
        ? statement.declaration
        : statement;

    if (declaration?.type !== "VariableDeclaration") {
      continue;
    }

    for (const declarator of declaration.declarations) {
      if (declarator.id.type === "Identifier") {
        initializers.set(declarator.id.name, declarator.init);
      }
    }
  }

  return initializers;
};

const exportsOnlyContexts = (statement, initializers) => {
  if (statement.type === "ExportDefaultDeclaration") {
    return isCreateContext(statement.declaration);
  }

  if (statement.type === "ExportAllDeclaration") {
    return statement.exportKind === "type";
  }

  if (statement.type !== "ExportNamedDeclaration") {
    return true;
  }

  if (statement.exportKind === "type" || statement.source) {
    return statement.exportKind === "type";
  }

  const { declaration } = statement;

  if (declaration?.type === "VariableDeclaration") {
    return declaration.declarations.every((declarator) =>
      isCreateContext(declarator.init),
    );
  }

  if (declaration) {
    return TYPE_DECLARATIONS.has(declaration.type);
  }

  return statement.specifiers.every(
    (specifier) =>
      specifier.exportKind === "type" ||
      (specifier.local.type === "Identifier" &&
        isCreateContext(initializers.get(specifier.local.name))),
  );
};

const isContextFile = (filename, program) => {
  if (!filename.endsWith("-context.ts")) {
    return false;
  }

  const initializers = localInitializers(program);

  return program.body.every((statement) =>
    exportsOnlyContexts(statement, initializers),
  );
};

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
        "React の値を import できる `.ts` は、hook のファイル(名前が `use-` で始まり、export する関数が `use` で始まる1つだけ)と、context のファイル(名前が `-context.ts` で終わり、`createContext` の結果と型だけを export する)です。ほかの `.ts` はテストできるロジックだけにし、型は `import type` で読みます。",
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
        if (
          imports.length === 0 ||
          isHookFile(filename, program) ||
          isContextFile(filename, program)
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
