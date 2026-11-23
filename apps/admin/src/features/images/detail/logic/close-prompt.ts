import type { MessageKey } from "@/i18n/use-translate";

/** 編集を閉じる前・画面を離れる前の確かめに出す文言。 */
export type ClosePrompt = Readonly<
  Record<"title" | "description" | "stay" | "leave", MessageKey>
>;

const WHILE_SAVING: ClosePrompt = {
  title: "imageDetail.leavingWhileSaving",
  description: "imageDetail.savingWillContinue",
  stay: "imageDetail.waitForSave",
  leave: "imageDetail.leaveDuringSave",
};

const DISCARD: ClosePrompt = {
  title: "imageDetail.discardTitle",
  description: "imageDetail.discardDescription",
  stay: "imageDetail.continueEditing",
  leave: "imageDetail.discard",
};

/** 保存を送っている間に離れるなら保存が続くことを、ほかは入力を捨てることを確かめる。 */
export const closePrompt = (whileSaving: boolean): ClosePrompt =>
  whileSaving ? WHILE_SAVING : DISCARD;
