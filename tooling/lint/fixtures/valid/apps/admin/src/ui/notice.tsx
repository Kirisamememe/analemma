import type { ReactNode } from "react";

import { tv } from "./tv";

const item = tv({
  base: "rounded-surface",
  variants: { isSelected: { true: "bg-primary/10" } },
});

/** 行の状態。 */
type ItemState = {
  /** 選んでいるか。 */
  readonly isSelected: boolean;
};

/** `Notice` に渡す値。 */
type NoticeProps = {
  /** 知らせの中身。 */
  readonly children: ReactNode;
  /** 進み具合(0〜1)。 */
  readonly progress: number;
};

/** 画面の中に知らせを出す部品。 */
export const Notice = ({ children, progress }: NoticeProps) => (
  <div
    className="flex gap-2 rounded-control border border-danger bg-danger/10 px-3 py-1.5"
    style={{ "--progress": progress }}
  >
    <span className="text-danger focus-ring is-hovered:state-hover" />
    <span className="w-(--progress) bg-fg/10" />
    <svg className="stroke-(length:--progress)" />
    <span className="w-1/2 rounded-surface" />
    <span className="-mt-2 -mb-1 md:-my-0.5" />
    <span className="m-auto mx-2 mt-0 mb-auto" />
    <span className="flex gap-x-3 gap-y-6" />
    <span className="px-panel" />
    <span className="whitespace-pre-line" />
    <span className="bg-primary text-on-primary" />
    <span className="bg-danger-strong text-on-danger-strong" />
    <span className="rounded-surface bg-surface outline -outline-offset-1 outline-fg/10" />
    <span className="outline-hidden is-focused:focus-ring is-invalid:outline-danger" />
    <span className="border-x-line bg-scrim/40 text-on-media" />
    <span className={item({ isSelected: true })} />
    <span className={({ isSelected }: ItemState) => item({ isSelected })} />
    {children}
  </div>
);
