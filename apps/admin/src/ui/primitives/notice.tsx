import type { ReactNode } from "react";

import { Icon, type IconName } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const notice = tv({
  slots: {
    root: "rounded-control border px-3 py-2",
    mark: "flex h-5 shrink-0 items-center", // 本文の1行(20px)の中央に、アイコンを置く
    content: "min-w-0 grow",
  },
  variants: {
    tone: {
      info: { root: "border-info bg-info/10 text-info" },
      success: { root: "border-success bg-success/10 text-success" },
      warning: { root: "border-warning bg-warning/10 text-warning" },
      danger: { root: "border-danger bg-danger/10 text-danger" },
    },
    hasIcon: { true: { root: "flex items-start gap-2" } },
  },
});

/** `Notice` に渡す値。 */
type NoticeProps = {
  /** 知らせの用途。 */
  tone: "info" | "success" | "warning" | "danger";
  /** 1行目の先頭に添えるアイコン。 */
  icon?: IconName | undefined;
  /** 知らせの中身。 */
  children: ReactNode;
};

/** 画面の中に残す知らせ(誤りはすぐに読み上げる)。 */
export const Notice = ({ tone, icon, children }: NoticeProps): ReactNode => {
  const { root, mark, content } = notice({ tone, hasIcon: icon !== undefined });

  return (
    <div
      className={root({ className: typography({ role: "body" }) })}
      role={tone === "danger" ? "alert" : "status"}
    >
      {icon === undefined ? (
        children
      ) : (
        <>
          <span className={mark()}>
            <Icon name={icon} />
          </span>
          <div className={content()}>{children}</div>
        </>
      )}
    </div>
  );
};
