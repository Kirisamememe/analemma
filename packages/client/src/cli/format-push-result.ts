import type {
  AcceptedKinds,
  IncompatibleKinds,
  UnauthorizedPush,
} from "./push-kind-definitions";

const CHANGE_LABELS = {
  created: "作った",
  updated: "書き換えた",
  unchanged: "変わらない",
} as const;

/** 定義を送った結果を、標準出力と標準エラーに書く行にする。 */
export const formatPushResult = (
  result: AcceptedKinds | IncompatibleKinds | UnauthorizedPush,
): string[] => {
  switch (result._tag) {
    case "Accepted":
      return [
        `種類の定義を送った(${String(result.kinds.length)} 件)。`,
        ...result.kinds.map(
          ({ change, name }) => `- ${name}: ${CHANGE_LABELS[change]}`,
        ),
      ];
    case "Incompatible":
      return [
        "種類の定義を断られた。次の固定ページの中身が、新しい定義に合わない。",
        ...result.pages.flatMap(({ issues, kind, slug, title }) => [
          `- ${kind} / ${slug}(${title})`,
          ...issues.map(
            ({ message, path }) =>
              `  - ${path.map(String).join(".")}: ${message}`,
          ),
        ]),
      ];
    case "Unauthorized":
      return [
        "デプロイ用のトークンを受け付けられなかった。ANALEMMA_DEPLOY_TOKEN を確かめる。",
      ];
  }
};
