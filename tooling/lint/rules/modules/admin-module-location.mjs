import { basename, dirname } from "node:path";

import { collectExportedFunctions } from "./exported-functions.mjs";

const HOOK_NAME = /^use[A-Z]/v;
const API_GROUPS = new Set(["admin", "auth", "deploy", "public"]);

const memberName = (node) => {
  if (node.type !== "MemberExpression") return undefined;

  return node.computed ? node.property.value : node.property.name;
};

const readsApiGroup = (node, clients) =>
  API_GROUPS.has(memberName(node)) &&
  (clients.has(node.object.name) || memberName(node.object) === "api");

const adminModuleLocation = {
  meta: {
    type: "problem",
    docs: {
      description:
        "管理画面の hook・純粋な関数・server の API を呼ぶ処理を、決めたフォルダの外に置かせない。",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          effectfulModules: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
      },
    ],
    messages: {
      query:
        "server の API を呼ぶ処理は、使う部品に一番近い `queries/` に置きます。",
      hook: "hook は、使う部品に近い `hooks/` に置きます。",
      logic:
        "関数を export する `.ts` は、`logic/`(純粋な関数)か `queries/`(server の API を呼ぶ処理)に置きます。ブラウザの API を使うなどで、そのどちらでもないファイルは、lint の設定の `effectfulModules` に足します。",
    },
  },
  /** export する関数の名前と、server の API の参照から、置き場所を確かめる。 */
  create(context) {
    const path = context.filename.split("/apps/admin/src/").at(-1);
    const directory = basename(dirname(path));
    const inQueries = directory === "queries";
    const inFeature = path.startsWith("features/");
    const checkLogic =
      path.endsWith(".ts") &&
      !inQueries &&
      directory !== "logic" &&
      !context.options[0]?.effectfulModules?.includes(path);

    const clients = new Set(["api"]);
    const clientTypes = new Set();
    let usesApi = false;

    return {
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ObjectPattern > Property"(
        node,
      ) {
        if (directory !== "hooks" && HOOK_NAME.test(node.value.name ?? "")) {
          context.report({ node: node.value, messageId: "hook" });
        }
      },
      ImportSpecifier(node) {
        if (
          node.imported.name === "ApiClient" &&
          node.parent.source.value === "@/api/api-types"
        ) {
          clientTypes.add(node.local.name);
        }
      },
      Identifier(node) {
        const annotation = node.typeAnnotation?.typeAnnotation;

        if (clientTypes.has(annotation?.typeName?.name)) clients.add(node.name);
      },
      Property(node) {
        if (
          node.parent.type === "ObjectPattern" &&
          node.key.name === "api" &&
          node.value.type === "Identifier"
        ) {
          clients.add(node.value.name);
        }
      },
      MemberExpression(node) {
        if (inFeature && !inQueries && readsApiGroup(node, clients)) {
          usesApi = true;
          context.report({ node, messageId: "query" });
        }
      },
      "Program:exit"(program) {
        for (const node of collectExportedFunctions(program)) {
          if (HOOK_NAME.test(node.id?.name ?? "")) {
            if (directory !== "hooks") {
              context.report({ node, messageId: "hook" });
            }
          } else if (checkLogic && !usesApi) {
            context.report({ node, messageId: "logic" });
          }
        }
      },
    };
  },
};

export default adminModuleLocation;
