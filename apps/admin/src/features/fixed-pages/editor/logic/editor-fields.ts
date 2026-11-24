import type { ApiOutputs } from "@/api/api-types";

type Fields = ApiOutputs["admin"]["kinds"]["get"]["fields"];
type Page = ApiOutputs["admin"]["fixedPages"]["get"];

/** 編集の画面が、種類の定義の替わりと保存をまたいで保つもの。 */
export type EditorHold = {
  /** 入力を始めたときの項目。 */
  readonly edited?: Fields | undefined;
  /** 削除を確かめ始めたときの項目。 */
  readonly deleting?: Fields | undefined;
  /** 保存を送った時点のページと、保存できた後のページ。 */
  readonly acknowledged?:
    | {
        /** 保存を送った時点で表示していたページ。 */
        readonly before: Page;
        /** 保存できた後のページ。 */
        readonly saved: Page;
      }
    | undefined;
};

/** フォームに並べる項目。 */
export const fieldsInUse = (hold: EditorHold, latest: Fields): Fields =>
  hold.edited ?? hold.deleting ?? latest;

/** 入力中に保つ項目を、入力の有無に合わせる。 */
export const holdWhileEditing = (
  hold: EditorHold,
  { editing, latest }: Record<"editing", boolean> & Record<"latest", Fields>,
): EditorHold => {
  const edited = editing ? fieldsInUse(hold, latest) : undefined;

  return edited === hold.edited ? hold : { ...hold, edited };
};

/** 削除の確認中に保つ項目を、確認の有無に合わせる。 */
export const holdWhileDeleting = (
  hold: EditorHold,
  { open, latest }: Record<"open", boolean> & Record<"latest", Fields>,
): EditorHold => {
  const deleting = open ? fieldsInUse(hold, latest) : undefined;

  return deleting === hold.deleting ? hold : { ...hold, deleting };
};

/** 入力を始めた後に、種類の定義の項目が替わったか。 */
export const fieldsChangedSinceEditing = (
  hold: EditorHold,
  latest: Fields,
): boolean => hold.edited !== undefined && hold.edited !== latest;

/** フォームに渡すページ。 */
export const pageInUse = (hold: EditorHold, page: Page): Page =>
  hold.acknowledged?.before === page ? hold.acknowledged.saved : page;
