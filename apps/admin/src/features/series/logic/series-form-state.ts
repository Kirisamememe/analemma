/** フォームを離れるときに確かめる内容。 */
export const seriesFormExit = (changed: boolean, saving: boolean) => {
  if (saving) {
    return {
      ask: true,
      title: "series.saving",
      description: "imageDetail.savingWillContinue",
      stay: "imageDetail.waitForSave",
      leave: "imageDetail.leaveDuringSave",
      tone: "secondary",
    } as const;
  }

  return {
    ask: changed,
    title: "imageDetail.discardTitle",
    description: "imageDetail.discardDescription",
    stay: "imageDetail.continueEditing",
    leave: "imageDetail.discard",
    tone: "danger",
  } as const;
};
