import { type KindDefinition, kindDefinitionList } from "@analemma/contract";

/** 定義のファイルから読めた、種類の定義。 */
export type ReadKinds = {
  /** 結果の種類。 */
  readonly _tag: "Read";
  /** 種類の定義。 */
  readonly kinds: KindDefinition[];
};

/** 定義のファイルから、種類の定義を読めないこと。 */
export type UnreadableKinds = {
  /** 結果の種類。 */
  readonly _tag: "Unreadable";
  /** 読めない理由。 */
  readonly problem: string;
};

const definitionOf = (kind: unknown): unknown =>
  typeof kind === "object" && kind !== null && "definition" in kind
    ? kind.definition
    : undefined;

/** 定義のファイルの default export から、種類の定義を読む。 */
export const readKindDefinitions = (
  module: unknown,
): ReadKinds | UnreadableKinds => {
  const kinds =
    typeof module === "object" && module !== null && "default" in module
      ? module.default
      : undefined;

  if (!Array.isArray(kinds)) {
    return {
      _tag: "Unreadable",
      problem:
        "定義のファイルは、defineKind で作った種類の配列を default export する",
    };
  }

  const parsed = kindDefinitionList.safeParse(
    kinds.map((kind: unknown) => definitionOf(kind)),
  );

  return parsed.success
    ? { _tag: "Read", kinds: parsed.data }
    : {
        _tag: "Unreadable",
        problem: parsed.error.issues
          .map(
            ({ message, path }) => `${path.map(String).join(".")}: ${message}`,
          )
          .join("\n"),
      };
};
