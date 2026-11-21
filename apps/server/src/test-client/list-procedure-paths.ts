import { isContractProcedure } from "@orpc/contract";

/** テストのために、contract の枝にある procedure を、`/` で区切ったパスで並べる。 */
export const listProcedurePaths = (node: unknown, path: string): string[] => {
  if (isContractProcedure(node)) {
    return [path];
  }

  if (typeof node !== "object" || node === null) {
    return [];
  }

  return Object.entries(node).flatMap(([key, child]) =>
    listProcedurePaths(child, `${path}/${key}`),
  );
};
