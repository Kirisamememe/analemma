import { useBlocker } from "@tanstack/react-router";
import { useRef, useState } from "react";

/** 画面を離れる前の確かめの状態。 */
export type LeaveConfirmation = {
  /** 移動の判断を待っているか。 */
  readonly _tag: "Asking" | "Idle";
  /** 止めた移動があれば続ける関数。 */
  readonly leave: () => void;
  /** 止めた移動をやめ、今の画面に残る関数。 */
  readonly stay: () => void;
};

/** 確かめが要るなら画面を離れるのを止め、確かめの状態を返す。 */
export const useLeaveConfirmation = (
  needsConfirmation: (destination?: string) => boolean,
): LeaveConfirmation => {
  const pending = useRef<PromiseWithResolvers<boolean> | undefined>(undefined);
  const [asking, setAsking] = useState(false);

  useBlocker({
    shouldBlockFn: ({ next }) => {
      if (!needsConfirmation(next.pathname)) return false;

      pending.current ??= Promise.withResolvers<boolean>();
      setAsking(true);

      return pending.current.promise;
    },
    enableBeforeUnload: () => needsConfirmation(),
  });

  const settle = (stay: boolean) => (): void => {
    pending.current?.resolve(stay);
    pending.current = undefined;
    setAsking(false);
  };

  return {
    _tag: asking ? "Asking" : "Idle",
    leave: settle(false),
    stay: settle(true),
  };
};
