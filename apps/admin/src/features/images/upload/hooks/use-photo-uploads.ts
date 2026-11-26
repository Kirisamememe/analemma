import { useCallback, useRef, useState } from "react";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import {
  IMAGES_QUERY_KEY,
  prependImage,
} from "@/features/images/queries/images-query";
import { useUploadMetadata } from "@/features/images/upload/hooks/use-upload-metadata";
import {
  type PhotoUpload,
  clearFinished,
  hasUnsentPhotos,
  nextWaiting,
  queuePhotos,
  retryUpload,
  withAdded,
  withStatus,
} from "@/features/images/upload/logic/photo-uploads";
import { uploadPhoto } from "@/features/images/upload/queries/upload-photo";

const LOGIN_PATH = "/login"; // セッションが切れたときに移る先。止めると、送れない画面に残る

type Change = (current: readonly PhotoUpload[]) => readonly PhotoUpload[];

/** 送る写真の一覧と、写真を足す・送り直す・結果を閉じる操作。 */
export const usePhotoUploads = (onComplete?: () => void) => {
  const { api } = useAppContext();
  const { refresh, updatePages } = useApiCache();
  const [uploads, setUploads] = useState<readonly PhotoUpload[]>([]);
  const latest = useRef(uploads); // 送り終えたときに、次に送る写真を選ぶ
  const active = useRef(true); // 画面を離れたら、次の写真を送らない
  const expired = useRef(false); // セッションが切れたら、ログインの画面へ移るのを止めない

  const apply = useCallback((change: Change): void => {
    latest.current = change(latest.current);
    setUploads(latest.current);
  }, []);

  const metadata = useUploadMetadata(uploads, {
    isActive: () => active.current,
    onComplete: (retained) => {
      apply((current) => clearFinished(current, retained));
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
      (hasUnsentPhotos(latest.current) || metadata.dirty || metadata.isSaving)
    );
  });

  const sending = useApiMutation({
    send: async (upload: PhotoUpload) => {
      const result = await uploadPhoto(api, upload.file);

      if (result._tag === "SessionExpired") {
        expired.current = true;

        throw result.error;
      }

      return result;
    },
    onSuccess: async (result, upload) => {
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
    const next = nextWaiting(latest.current);

    if (!active.current || next === undefined) return;

    apply(withStatus(next.id, "sending"));
    mutate(next);
  }, [apply, mutate]);

  const sendIfIdle = useCallback((): void => {
    if (!latest.current.some(({ status }) => status === "sending")) {
      sendNext();
    }
  }, [sendNext]);

  const add = useCallback(
    (files: readonly File[]): void => {
      apply((current) =>
        queuePhotos(current, { files, maxBytes: PHOTO_MAX_BYTES }),
      );
      sendIfIdle();
    },
    [apply, sendIfIdle],
  );

  const retry = useCallback(
    (id: number): void => {
      apply(retryUpload(id));
      sendIfIdle();
    },
    [apply, sendIfIdle],
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
