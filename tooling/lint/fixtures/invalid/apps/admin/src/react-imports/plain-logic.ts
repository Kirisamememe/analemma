import { startTransition } from "react";

/** 状態の更新を、急がない更新として送る。 */
export const deferUpdate = (update: () => void): void => {
  startTransition(update);
};
