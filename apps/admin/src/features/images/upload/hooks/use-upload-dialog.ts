import { useCallback, useState } from "react";

import { countDiscarded, isUploading } from "../logic/photo-uploads";
import { usePhotoDrop } from "./use-photo-drop";
import { usePhotoUploads } from "./use-photo-uploads";
import { useRetryFocus } from "./use-retry-focus";

const ERROR_MESSAGES = {
  title: "imageDetail.invalidTitle",
  description: "imageDetail.invalidDescription",
  failed: "imageDetail.saveFailed",
  gone: "imageDetail.gone",
} as const;

/** 写真を追加する Dialog の開閉、選択中の写真、送信・保存の表示をまとめる。 */
export const useUploadDialog = () => {
  const [isOpen, setOpen] = useState(false);
  const [page, setPage] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);

  const attachPanel = useCallback((section: HTMLDivElement | null) => {
    setPanel(section?.closest("[role=dialog]") ?? null);
  }, []);

  const [selectedId, select] = useState<number>();

  const {
    uploads,
    add,
    retry,
    clear,
    closeFailure,
    track,
    leaving,
    metadata,
    settle,
  } = usePhotoUploads({
    onComplete: () => {
      setOpen(false);
      select(undefined);
    },
  });

  const focus = useRetryFocus({ retry, clear });

  const attach = useCallback(
    (root: HTMLDivElement | null) => {
      setPage(root?.closest("main") ?? null);
      return track(root);
    },
    [track],
  );

  const open = (): void => {
    if (isOpen) return;

    focus.addButton.current?.focus({ preventScroll: true });
    setOpen(true);
  };

  const receive = (files: readonly File[]): void => {
    if (files.length === 0 || metadata.isSaving) return;

    open();
    add(files);
  };

  const isDragging = usePhotoDrop(
    metadata.isSaving ? null : isOpen ? panel : page,
    receive,
  );

  const [discarded, setDiscarded] = useState(0);
  const [isDiscarding, setDiscarding] = useState(false);

  const finish = (): void => {
    const count = countDiscarded(uploads, metadata.hasChanges);

    if (count === 0) metadata.finish();
    else {
      setDiscarded(count);
      setDiscarding(true);
    }
  };

  const selected = uploads.find(({ id }) => id === selectedId) ?? uploads[0];
  const { error } = metadata;
  const problem = error && uploads.find(({ id }) => id === error.id);

  return {
    isOpen,
    open,
    setOpen: (next: boolean): void => {
      if (!next) closeFailure();

      setOpen(next);
    },
    receive,
    page,
    attach,
    attachPanel,
    focus,
    leaving,
    finish,
    discarding: {
      _tag: isDiscarding ? "Asking" : "Idle",
      count: Math.max(discarded, countDiscarded(uploads, metadata.hasChanges)),
      stay: () => {
        setDiscarding(false);
      },
      leave: () => {
        setDiscarding(false);
        metadata.finish();
      },
    } as const,
    metadata,
    isDragging: isDragging && !metadata.isSaving,
    select,
    selected,
    settle,
    uploads,
    isUploading: isUploading(uploads),
    problem: error &&
      problem && {
        name: problem.file.name,
        message: ERROR_MESSAGES[error.reason],
        show:
          selected?.id === problem.id
            ? undefined
            : () => {
                select(problem.id);
              },
      },
  };
};
