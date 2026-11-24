import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { useApiData } from "@/api/server-state/use-api-data";
import { useApiPolling } from "@/api/server-state/use-api-polling";
import {
  countRun,
  isImporting,
  listImportable,
  type RunCounts,
  takeImportBatch,
} from "@/features/dropbox/logic/photo-rows";
import {
  type StartImportResult,
  startDropboxImport,
} from "@/features/dropbox/queries/dropbox-actions";
import {
  DROPBOX_IMPORT_KEY,
  DROPBOX_PHOTOS_KEY,
  type DropboxImport,
  type DropboxPhotos,
  type DropboxSelection,
  loadDropboxImport,
  loadDropboxPhotos,
} from "@/features/dropbox/queries/dropbox-queries";

const POLLING_MS = 1000;

/** 取り込みの状態と、取り込みを始める操作。 */
export type DropboxImportState = {
  /** 取り込める写真。 */
  readonly importable: readonly DropboxSelection[];
  /** 次の取り込みで送る写真(上限の枚数まで)。 */
  readonly batch: readonly DropboxSelection[];
  /** 取り込み済みの写真の数。 */
  readonly importedCount: number;
  /** 取り込みの途中か。 */
  readonly running: boolean;
  /** 最後に始めた取り込みの数(始めていなければ undefined)。 */
  readonly counts: RunCounts | undefined;
  /** 取り込める写真の取り込みを始める。 */
  readonly start: () => void;
  /** 始める操作を送っているか。 */
  readonly starting: boolean;
  /** 始められなかった理由。 */
  readonly failure: Exclude<StartImportResult["_tag"], "Started"> | undefined;
  /** App folder の写真を読み直す。 */
  readonly reload: () => void;
};

/** 取り込みの途中は進み具合を読み直し、取り込める写真の数と、始める操作を返す。 */
export const useDropboxImport = (): DropboxImportState => {
  const { api } = useAppContext();
  const cache = useApiCache();

  useApiPolling({
    key: DROPBOX_IMPORT_KEY,
    load: async () => loadDropboxImport(api),
    interval: (run: DropboxImport | null | undefined) =>
      isImporting(run) ? POLLING_MS : false,
  });

  const run = useApiData({
    key: DROPBOX_IMPORT_KEY,
    load: async () => loadDropboxImport(api),
    select: (current: DropboxImport | null) => current,
  });

  const photos = useApiData({
    key: DROPBOX_PHOTOS_KEY,
    load: async () => loadDropboxPhotos(api),
    select: (listed: DropboxPhotos) =>
      listed._tag === "Listed" ? listed.photos : [],
  });

  const mutation = useApiMutation({
    key: ["admin", "dropbox", "startImport"],
    send: async (selected: readonly DropboxSelection[]) =>
      startDropboxImport(api, selected),
    onSuccess: async (result) => {
      if (result._tag === "Started") await cache.refresh(DROPBOX_IMPORT_KEY);
    },
  });

  const importable = listImportable(photos ?? [], run);
  const batch = takeImportBatch(importable);

  return {
    importable,
    batch,
    importedCount: (photos ?? []).filter(({ imported }) => imported !== null)
      .length,
    running: isImporting(run),
    counts: run === null || run === undefined ? undefined : countRun(run),
    start: () => {
      if (batch.length > 0) mutation.mutate(batch);
    },
    starting: mutation.isPending,
    failure:
      mutation.data === undefined || mutation.data._tag === "Started"
        ? undefined
        : mutation.data._tag,
    reload: () => {
      mutation.reset();
      void cache.refresh(DROPBOX_PHOTOS_KEY);
    },
  };
};
