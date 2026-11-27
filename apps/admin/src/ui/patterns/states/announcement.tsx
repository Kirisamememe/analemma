import type { ReactNode } from "react";

/** 読み上げにだけ伝える知らせに渡す値。 */
type AnnouncementProps = {
  /** 伝える文言(無ければ何も伝えない)。 */
  children: ReactNode;
  /** 何回目の知らせか(同じ文言を続けて伝えるときに替える)。 */
  revision?: number;
};

/** 画面には出さず、変わるたびに読み上げに伝える知らせ。 */
export const Announcement = ({
  children,
  revision = 0,
}: AnnouncementProps): ReactNode => (
  <output className="sr-only">
    <span key={revision}>{children}</span>
  </output>
);
