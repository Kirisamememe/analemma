import type { ReactNode } from "react";

import { carouselStyle } from "./carousel-styles";

/** 送信済みの割合の表示に渡す値。 */
type TransferProgressProps = {
  /** 送信済みの割合（%）。 */
  percent: number;
  /** 転送中のファイルを特定できる名前。 */
  label: string;
};

/** 写真の上に送信済みの割合を示す。 */
export const TransferProgress = ({
  percent,
  label,
}: TransferProgressProps): ReactNode => (
  <div className={carouselStyle().overlay()}>
    <progress
      className="sr-only"
      aria-label={label}
      max={100}
      value={percent}
    />
    <svg
      aria-hidden="true"
      className="size-8"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx={16} cy={16} r={13} opacity={0.28} />
      {percent > 0 && (
        <circle
          cx={16}
          cy={16}
          r={13}
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={100 - percent}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />
      )}
    </svg>
  </div>
);
