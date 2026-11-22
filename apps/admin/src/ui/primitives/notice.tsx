import type { ReactNode } from "react";

import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const notice = tv({
  base: "rounded-control border px-3 py-2",
  variants: {
    tone: {
      info: "border-info bg-info/10 text-info",
      success: "border-success bg-success/10 text-success",
      warning: "border-warning bg-warning/10 text-warning",
      danger: "border-danger bg-danger/10 text-danger",
    },
  },
});

/** `Notice` に渡す値。 */
type NoticeProps = {
  /** 知らせの用途。 */
  tone: "info" | "success" | "warning" | "danger";
  /** 知らせの中身。 */
  children: ReactNode;
};

/** 画面の中に残す知らせ(誤りはすぐに読み上げる)。 */
export const Notice = ({ tone, children }: NoticeProps): ReactNode => (
  <div
    className={notice({ tone, className: typography({ role: "body" }) })}
    role={tone === "danger" ? "alert" : "status"}
  >
    {children}
  </div>
);
