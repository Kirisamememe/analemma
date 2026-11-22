import { dirname, resolve, sep } from "node:path";

const WORKSPACE_GROUPS = new Set(["apps", "packages"]);
const SOURCE_ALIAS = "@/";
const SOURCE_ALIAS_WORKSPACES = new Set(["apps/admin", "apps/server"]);

const workspaceRoot = (filename) => {
  const segments = filename.split(sep);
  const groupIndex = segments.findLastIndex(
    (segment, index) =>
      WORKSPACE_GROUPS.has(segment) && index < segments.length - 2,
  );

  return groupIndex === -1 ? "" : segments.slice(0, groupIndex + 2).join(sep);
};

const noCrossWorkspaceImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "相対パスと @/ で、ワークスペースの外にあるファイルを import することを禁止する。",
    },
    schema: [],
    messages: {
      crossWorkspace:
        "{{source}} は、このワークスペースの外を指しています。ほかのワークスペースは、package.json に書いたパッケージ名で import します(書いていない依存は import できません)。",
    },
  },
  /** ワークスペースの中のファイルごとに、import の行き先を調べる。 */
  create(context) {
    const root = workspaceRoot(context.filename);

    if (root === "") {
      return {};
    }

    const directory = dirname(context.filename);
    const usesSourceAlias = SOURCE_ALIAS_WORKSPACES.has(
      root.split(sep).slice(-2).join("/"),
    );

    const resolveImport = (source) => {
      if (source.startsWith(".")) {
        return resolve(directory, source);
      }

      if (usesSourceAlias && source.startsWith(SOURCE_ALIAS)) {
        return resolve(root, "src", source.slice(SOURCE_ALIAS.length));
      }

      return undefined;
    };

    const check = (node, source) => {
      if (typeof source !== "string") {
        return;
      }

      const target = resolveImport(source);

      if (
        target !== undefined &&
        target !== root &&
        !target.startsWith(`${root}${sep}`)
      ) {
        context.report({ node, messageId: "crossWorkspace", data: { source } });
      }
    };

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        check(node, node.source?.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        check(node, node.source.value);
      },
    };
  },
};

export default noCrossWorkspaceImport;
