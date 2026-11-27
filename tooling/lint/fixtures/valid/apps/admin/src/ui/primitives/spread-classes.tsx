import { merge } from "../tv";

const spreadClasses = (active: boolean) =>
  merge([
    "relative",
    ...(active
      ? [
          "flex size-10 shrink-0 items-center justify-center rounded-control text-fg outline-hidden",
        ]
      : []),
  ]);

/** 状態に応じて class を足す部品。 */
export const SpreadClasses = () => <span className={spreadClasses(true)} />;
