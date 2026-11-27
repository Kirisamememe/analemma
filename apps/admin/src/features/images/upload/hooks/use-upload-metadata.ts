import { useCallback, useRef, useState } from "react";

import { createUploadValue } from "../upload-value";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { isValidImageText } from "@/features/images/detail/logic/image-text";
import { mergeImageChange } from "@/features/images/detail/logic/merge-image-change";
import {
  isUploading,
  type PhotoUpload,
} from "@/features/images/upload/logic/photo-uploads";
import {
  saveUploadMetadata,
  type UploadMetadata,
} from "@/features/images/upload/queries/save-upload-metadata";
import { imageQueryKey, type LoadedImage } from "@/queries/image-query";
import { IMAGES_QUERY_KEY, updateImagePage } from "@/queries/images-query";

const EMPTY = { title: "", description: "" };
const FIELDS = ["title", "description"] as const;

type Entry = {
  /** 管理者が入力した値。 */
  readonly values: UploadMetadata;
  /** 保存できた値。 */
  readonly saved: UploadMetadata;
};

type Save = {
  /** 送る一覧の中の番号。 */
  readonly id: number;
  /** server の画像 ID。 */
  readonly imageId: string;
  /** 変更した欄の値。 */
  readonly changes: Partial<UploadMetadata>;
};

type SaveError = {
  /** 保存できない写真の番号。 */
  readonly id: number;
  /** 誤りがある欄か、送信の失敗。 */
  readonly reason: keyof UploadMetadata | "failed" | "gone";
};

type SaveCallbacks = {
  /** 画面を離れる前か。 */
  readonly isActive: () => boolean;
  /** すべての保存を終えた後の処理。 */
  readonly onComplete: () => void;
};

const changed = (entry: Entry, field: keyof UploadMetadata): boolean =>
  entry.values[field].trim() !== entry.saved[field].trim();

/** 送る写真ごとに入力を保ち、完了時に追加できた写真の変更を保存する。 */
export const useUploadMetadata = (
  uploads: readonly PhotoUpload[],
  { isActive, onComplete }: SaveCallbacks,
) => {
  const { api } = useAppContext();
  const { update, updatePages, refresh } = useApiCache();

  const [entries] = useState(() =>
    createUploadValue<ReadonlyMap<number, Entry>>(new Map()),
  );

  const [error, setError] = useState<SaveError>();
  const pending = useRef<Save[] | undefined>(undefined);

  const reset = useCallback(() => {
    entries.set(new Map());
    setError(undefined);
  }, [entries]);

  const hasChanges = (id: number): boolean => {
    const entry = entries.read().get(id);
    return entry !== undefined && FIELDS.some((field) => changed(entry, field));
  };

  const complete = () => {
    entries.set(new Map());
    setError(undefined);
    onComplete();
  };

  const fail = (id: number, reason: SaveError["reason"]) => {
    pending.current = undefined;

    if (isActive()) setError({ id, reason });
  };

  const saving = useApiMutation({
    send: (item: Save) => saveUploadMetadata(api, { ...item, isActive }),
    onSuccess: async (result, item) => {
      if (result._tag === "Stopped") return;

      const detail = imageQueryKey(item.imageId);

      if (result._tag === "NotFound") {
        fail(item.id, "gone");
        await Promise.all([
          refresh(detail),
          updatePages(IMAGES_QUERY_KEY, updateImagePage(item.imageId)),
        ]);

        return;
      }

      const apply = mergeImageChange(result.image, "text");

      await Promise.all([
        update<LoadedImage>(detail, (current) =>
          current._tag === "Succeeded"
            ? { ...current, data: apply(current.data) }
            : current,
        ),
        updatePages(IMAGES_QUERY_KEY, updateImagePage(item.imageId, apply)),
      ]);

      if (!isActive()) return;

      const current = entries.read();
      const entry = current.get(item.id);

      if (entry) {
        entries.set(
          new Map(current).set(item.id, { ...entry, saved: entry.values }),
        );
      }

      const next = pending.current?.shift();

      if (next === undefined) {
        pending.current = undefined;
        complete();
      } else saving.mutate(next);
    },
    onError: (item) => {
      fail(item.id, "failed");
      void refresh(imageQueryKey(item.imageId), "active");
      void refresh(IMAGES_QUERY_KEY, "active");
    },
  });

  const finish = () => {
    if (pending.current !== undefined || isUploading(uploads)) return;

    const queue: Save[] = [];

    for (const { id, imageId, status } of uploads) {
      const entry = entries.read().get(id);

      const isRegistered = status === "added" || status === "converting";

      if (entry === undefined || !isRegistered || imageId === undefined) {
        continue;
      }

      const changes: Partial<UploadMetadata> = {};

      for (const field of FIELDS) {
        if (!changed(entry, field)) continue;

        if (!isValidImageText(field, entry.values[field])) {
          setError({ id, reason: field });

          return;
        }

        changes[field] = entry.values[field];
      }

      if (Object.keys(changes).length > 0) queue.push({ id, imageId, changes });
    }

    const first = queue.shift();

    if (first === undefined) complete();
    else {
      setError(undefined);
      pending.current = queue;
      saving.mutate(first);
    }
  };

  const change = (id: number, values: Partial<UploadMetadata>) => {
    if (pending.current !== undefined) return;

    if (error?.id === id) setError(undefined);

    const current = entries.read();
    const entry = current.get(id) ?? { values: EMPTY, saved: EMPTY };

    entries.set(
      new Map(current).set(id, {
        ...entry,
        values: { ...entry.values, ...values },
      }),
    );
  };

  return {
    subscribe: entries.subscribe,
    draft: (id: number) => entries.read().get(id)?.values ?? EMPTY,
    change,
    finish,
    hasChanges,
    isDirty: () => uploads.some(({ id }) => hasChanges(id)),
    error,
    isSaving: saving.isPending,
    reset,
  };
};
