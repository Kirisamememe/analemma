import { dirname, resolve, sep } from "node:path";

const WORKSPACE_GROUPS = new Set(["apps", "packages"]);

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
        "相対パスで、自分のワークスペースの外にあるファイルを import することを禁止する。",
    },
    schema: [],
    messages: {
      crossWorkspace:
        "{{source}} は、このワークスペースの外を指しています。ほかのワークスペースは、package.json に書いたパッケージ名で import します(書いていない依存は import できません)。",
    },
  },
  /** ワークスペースの中のファイルごとに、相対パスの import の行き先を調べる。 */
  create(context) {
    const root = workspaceRoot(context.filename);

    if (root === "") {
      return {};
    }

    const check = (node, source) => {
      if (typeof source !== "string" || !source.startsWith(".")) {
        return;
      }

      const target = resolve(dirname(context.filename), source);

      if (target !== root && !target.startsWith(`${root}${sep}`)) {
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
