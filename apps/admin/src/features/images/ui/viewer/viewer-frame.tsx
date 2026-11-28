import type { ReactNode } from "react";

import { viewerStyle as style } from "./viewer-styles";

const observeBar = (header: HTMLElement | null) => {
  if (header === null) return undefined;

  const root = header.ownerDocument.documentElement;

  const observer = new ResizeObserver(([entry]) => {
    const height = entry?.borderBoxSize[0]?.blockSize;

    if (height !== undefined) {
      root.style.setProperty("--top-bar-height", `${height}px`);
    }
  });

  observer.observe(header);

  return () => {
    observer.disconnect();
    root.style.removeProperty("--top-bar-height");
  };
};

/** 写真を見る画面の骨組みに渡す値。 */
type ViewerFrameProps = {
  /** 帯の左に置く、一覧へ戻るリンク。 */
  back: ReactNode;
  /** 帯の右に置く操作。 */
  actions?: ReactNode;
  /** 帯の下の中身。 */
  children: ReactNode;
};

/** 写真を見る画面の、暗い地と上の帯。 */
export const ViewerFrame = ({
  back,
  actions,
  children,
}: ViewerFrameProps): ReactNode => (
  <div className={style.root()}>
    <header ref={observeBar} data-top-bar="always" className={style.bar()}>
      {back}
      <div className={style.actions()}>{actions}</div>
    </header>
    <main className={style.content()}>{children}</main>
  </div>
);
