import { useBlocker } from "@tanstack/react-router";

/** 画面を離れる前の確かめの状態。 */
export type LeaveConfirmation =
  | {
      /** どの状態か。 */
      readonly _tag: "Idle";
    }
  | {
      /** どの状態か。 */
      readonly _tag: "Asking";
      /** 止めた移動を続ける関数。 */
      readonly leave: () => void;
      /** 止めた移動をやめ、今の画面に残る関数。 */
      readonly stay: () => void;
    };

/** 確かめが要るなら画面を離れるのを止め、確かめの状態を返す。 */
export const useLeaveConfirmation = (
  needsConfirmation: () => boolean,
): LeaveConfirmation => {
  const blocker = useBlocker({
    shouldBlockFn: () => needsConfirmation(),
    enableBeforeUnload: () => needsConfirmation(),
    withResolver: true,
  });

  return blocker.status === "blocked"
    ? { _tag: "Asking", leave: blocker.proceed, stay: blocker.reset }
    : { _tag: "Idle" };
};
