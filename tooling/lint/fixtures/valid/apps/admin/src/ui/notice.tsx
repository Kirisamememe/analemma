import type { ReactNode } from "react";

/** 知らせの帯に渡す値。 */
type NoticeProps = {
  /** 知らせの中身。 */
  readonly children: ReactNode;
  /** 進み具合(0〜1)。 */
  readonly progress: number;
};

/** 画面の中の知らせの帯。 */
export const Notice = ({ children, progress }: NoticeProps) => (
  <div
    className="flex gap-2 rounded-control border border-danger bg-danger/10 px-3 py-1.5 text-danger focus-ring is-hovered:state-hover"
    style={{ "--progress": progress }}
  >
    <span className="w-(--progress) bg-fg/10" />
    {children}
  </div>
);
