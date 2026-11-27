import { useCallback, useRef, useState } from "react";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import { createUploadValue } from "../upload-value";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { useUploadMetadata } from "@/features/images/upload/hooks/use-upload-metadata";
import {
  type PhotoUpload,
  clearFinished,
  deferUpload,
  hasUnsentPhotos,
  nextUploads,
  queuePhotos,
  retryUpload,
  withAdded,
  withStatus,
} from "@/features/images/upload/logic/photo-uploads";
import { uploadPhoto } from "@/features/images/upload/queries/upload-photo";
import { IMAGES_QUERY_KEY, prependImage } from "@/queries/images-query";

type Transfer = PhotoUpload & {
  /** この送信試行で受け取った転送率を記録する。 */
  readonly progress: ReturnType<typeof createUploadValue<number>>;
};

const LOGIN_PATH = "/login"; // セッションが切れたときに移る先。止めると、送れない画面に残る
const BUSY_WAIT = 10_000; // server が 503 に添える Retry-After と同じ時間(ms)

type Change = (current: readonly PhotoUpload[]) => readonly PhotoUpload[];

type PhotoUploadsOptions = {
  /** 入力の保存が済んだときに呼ぶ関数。 */
  readonly onComplete?: () => void;
  /** server の受付が埋まっていたときに、次に送るまで待つ時間(ms)。 */
  readonly busyWait?: number;
};

/** 送る写真の一覧と、写真を足す・送り直す・結果を閉じる操作。 */
export const usePhotoUploads = ({
  onComplete,
  busyWait = BUSY_WAIT,
}: PhotoUploadsOptions = {}) => {
  const { api } = useAppContext();
  const { refresh, updatePages } = useApiCache();
  const [uploads, setUploads] = useState<readonly PhotoUpload[]>([]);
  const latest = useRef(uploads); // 送り終えたときに、次に送る写真を選ぶ
  const active = useRef(true); // 画面を離れたら、次の写真を送らない
  const expired = useRef(false); // セッションが切れたら、ログインの画面へ移るのを止めない
  const busy = useRef<ReturnType<typeof setTimeout>>(undefined); // server の受付が空くのを待つ間は、1枚ずつ送る

  const apply = useCallback((change: Change): void => {
    latest.current = change(latest.current);
    setUploads(latest.current);
  }, []);

  const metadata = useUploadMetadata(uploads, {
    isActive: () => active.current,
    onComplete: () => {
      apply(clearFinished);
      onComplete?.();
    },
  });

  const leaving = useLeaveConfirmation((destination) => {
    if (destination === LOGIN_PATH) {
      active.current = false; // ログインの画面へ移るなら、確かめずに残りの写真を送らない

      return false;
    }

    return (
      !expired.current &&
      (hasUnsentPhotos(latest.current) ||
        metadata.isDirty() ||
        metadata.isSaving)
    );
  });

  const waitForServer = (): void => {
    clearTimeout(busy.current);
    busy.current = setTimeout(() => {
      busy.current = undefined;
      sendNext();
    }, busyWait);
  };

  const sending = useApiMutation({
    send: async (upload: Transfer) => {
      const result = await uploadPhoto(api, {
        photo: upload.file,
        onUploadProgress: (fraction) => {
          upload.progress.set(
            fraction === 1 ? 100 : Math.min(99, Math.round(fraction * 100)),
          );
        },
      });

      if (result._tag === "SessionExpired") {
        expired.current = true;

        throw result.error;
      }

      return result;
    },
    onSuccess: async (result, upload) => {
      if (result._tag === "Busy") {
        apply(deferUpload(upload.id));
        waitForServer(); // 受けていないことが確かなので、送り直しても二重に登録されない

        return;
      }

      apply(
        result._tag === "Added"
          ? withAdded(upload.id, result.image)
          : withStatus(upload.id, "unsupported"),
      );
      sendNext();

      if (result._tag !== "Added") return;

      await (active.current && upload.retried !== true
        ? updatePages(IMAGES_QUERY_KEY, prependImage(result.image))
        : refresh(IMAGES_QUERY_KEY)); // 送り直した写真は、前の送信で登録されていることがある
    },
    onError: (upload) => {
      apply(withStatus(upload.id, "failed"));
      void refresh(IMAGES_QUERY_KEY); // 登録できたかが分からないので、一覧を server に合わせる
      sendNext();
    },
  });

  const { mutate } = sending;

  const sendNext = useCallback((): void => {
    if (!active.current || expired.current) return;

    const limit = busy.current === undefined ? undefined : 1;

    for (const next of nextUploads(latest.current, limit)) {
      const transfer: Transfer = {
        ...next,
        status: "sending",
        progress: createUploadValue(0),
      };

      apply((current) =>
        current.map((upload) => (upload.id === next.id ? transfer : upload)),
      );
      mutate(transfer);
    }
  }, [apply, mutate]);

  const add = useCallback(
    (files: readonly File[]): void => {
      apply((current) =>
        queuePhotos(current, { files, maxBytes: PHOTO_MAX_BYTES }),
      );
      sendNext();
    },
    [apply, sendNext],
  );

  const { isSaving } = metadata;

  const retry = useCallback(
    (id: number): void => {
      if (isSaving) return;

      apply(retryUpload(id));
      sendNext();
    },
    [apply, isSaving, sendNext],
  );

  const { reset } = metadata;

  const clear = useCallback((): void => {
    reset();
    apply(clearFinished);
  }, [apply, reset]);

  const track = useCallback((element: HTMLElement | null) => {
    if (element === null) return;

    active.current = true;

    return () => {
      active.current = false;
      clearTimeout(busy.current);
      busy.current = undefined;
    };
  }, []);

  const leave = () => {
    if (leaving._tag === "Asking") active.current = false;

    leaving.leave();
  };

  return {
    uploads,
    metadata,
    leaving: { ...leaving, leave },
    add,
    retry,
    clear,
    track,
  };
};
