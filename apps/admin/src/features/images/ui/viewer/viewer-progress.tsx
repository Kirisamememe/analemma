import type { ReactNode } from "react";

import { viewerStyle as style } from "./viewer-styles";

import { Text } from "@/ui/layout";
import { LoadingStatus } from "@/ui/patterns";
import { Spinner } from "@/ui/primitives/graphics";

/** 読み込み中の案内に渡す値。 */
type ViewerProgressProps = {
  /** 読み込み中の案内。 */
  label: string;
};

/** 写真の上に出す、読み込み中の案内。 */
export const ViewerProgress = ({ label }: ViewerProgressProps): ReactNode => {
  return (
    <>
      <LoadingStatus label={label} />
      <div aria-hidden="true" className={style.progress()}>
        <Spinner />
        <Text as="span">{label}</Text>
      </div>
    </>
  );
};
