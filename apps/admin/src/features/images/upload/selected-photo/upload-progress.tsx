import { memo, type ReactNode, useSyncExternalStore } from "react";

import type { UploadValue } from "../upload-value";

import { TransferProgress } from "@/features/images/ui/upload/transfer-progress";

/** 送信中の写真の転送率に渡す値。 */
type UploadProgressProps = {
  /** 送信試行ごとの転送率。 */
  progress: UploadValue<number>;
  /** 送信している写真の名前。 */
  label: string;
};

const UploadProgressContent = ({
  progress,
  label,
}: UploadProgressProps): ReactNode => {
  const percent = useSyncExternalStore(progress.subscribe, progress.read);

  return <TransferProgress percent={percent} label={label} />;
};

/** 送信の試行ごとの転送率を購読して、写真の上に示す。 */
export const UploadProgress = memo(UploadProgressContent);
