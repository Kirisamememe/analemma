import type { ReactNode } from "react";

import { Text } from "@/ui/layout";
import { LoadingStatus } from "@/ui/patterns";
import { Spinner } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const progress = tv({
  slots: {
    frame: "absolute flex justify-center",
    pill: [
      "flex items-center gap-2 rounded-surface bg-surface px-4 py-2",
      "forced-colors:hidden",
    ],
  },
  variants: {
    place: {
      top: {
        frame: "pointer-events-none inset-x-0 top-4",
        pill: "pointer-events-none loading-state-animation",
      },
      center: {
        frame: "inset-0 items-center",
        pill: "transition-opacity loading-delay starting:opacity-0",
      },
    },
  },
});

/** 写真の上に出す読み込み中の表示に渡す値。 */
type PhotoProgressProps = {
  /** 何を読み込んでいるかを伝える文言。 */
  label: string;
  /** 写真の上端に置くか、真ん中に置くか。 */
  place: "top" | "center";
};

/** 写真の上に、Spinner と文言で読み込み中を出し、読み上げには文言だけを伝える。 */
export const PhotoProgress = ({
  label,
  place,
}: PhotoProgressProps): ReactNode => {
  const style = progress({ place });
  const status = <LoadingStatus label={label} />;

  const pill = (
    <span aria-hidden="true" className={style.pill()}>
      <Spinner />
      <Text as="span">{label}</Text>
    </span>
  );

  return place === "top" ? (
    <>
      {status}
      <div className={style.frame()}>{pill}</div>
    </>
  ) : (
    <div className={style.frame()}>
      {status}
      {pill}
    </div>
  );
};
