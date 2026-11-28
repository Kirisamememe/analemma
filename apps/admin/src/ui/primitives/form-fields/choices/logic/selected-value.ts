/** 選択肢の一覧が返す key を、選んだ値にする。 */
export const toSelectedValue = (key: string | number | null): string | null =>
  typeof key === "string" && key !== "" ? key : null;
