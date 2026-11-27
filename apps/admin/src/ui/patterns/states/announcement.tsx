import type { ReactNode } from "react";

/** 読み上げにだけ伝える知らせに渡す値。 */
type AnnouncementProps = {
  /** 伝える文言(無ければ何も伝えない)。 */
  children: ReactNode;
};

/** 画面には出さず、変わるたびに読み上げに伝える知らせ。 */
export const Announcement = ({ children }: AnnouncementProps): ReactNode => (
  <output className="sr-only">{children}</output>
);
