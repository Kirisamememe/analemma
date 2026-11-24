import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import {
  type AuthorizeResult,
  authorizeDropbox,
  disconnectDropbox,
} from "@/features/dropbox/queries/dropbox-actions";
import {
  DROPBOX_CONNECTION_KEY,
  DROPBOX_IMPORT_KEY,
  DROPBOX_PHOTOS_KEY,
} from "@/features/dropbox/queries/dropbox-queries";

/** つなぐ操作と切る操作の、うまくいかなかった理由。 */
export type ConnectionFailure =
  | Exclude<AuthorizeResult["_tag"], "Opened">
  | "ImportRunning"
  | "Failed";

/** Dropbox につなぐ操作と、切る操作。 */
export type DropboxConnectionActions = {
  /** Dropbox の認可の画面へ移る。 */
  readonly open: () => void;
  /** 認可の画面の URL を作らせているか。 */
  readonly opening: boolean;
  /** 接続を切る。 */
  readonly disconnect: () => void;
  /** 切る操作を送っているか。 */
  readonly disconnecting: boolean;
  /** うまくいかなかった理由。 */
  readonly failure: ConnectionFailure | undefined;
};

/** Dropbox の認可の画面へ移る操作と、接続を切る操作を返す。 */
export const useDropboxConnectionActions = (
  navigate: (url: string) => void,
): DropboxConnectionActions => {
  const { api } = useAppContext();
  const cache = useApiCache();

  const opening = useApiMutation({
    key: ["admin", "dropbox", "authorize"],
    send: async () => authorizeDropbox(api),
    onSuccess: async (result) => {
      if (result._tag === "Opened") navigate(result.url);

      if (result._tag === "AlreadyConnected") {
        await cache.refresh(DROPBOX_CONNECTION_KEY);
      }
    },
  });

  const disconnecting = useApiMutation({
    key: ["admin", "dropbox", "disconnect"],
    send: async () => disconnectDropbox(api),
    onSuccess: async (result) => {
      if (result !== "Disconnected") return;

      await Promise.all([
        cache.refresh(DROPBOX_CONNECTION_KEY),
        cache.refresh(DROPBOX_PHOTOS_KEY),
        cache.refresh(DROPBOX_IMPORT_KEY),
      ]);
    },
  });

  const failure = ((): ConnectionFailure | undefined => {
    if (opening.isError || disconnecting.isError) return "Failed";

    if (opening.data !== undefined && opening.data._tag !== "Opened") {
      return opening.data._tag;
    }

    return disconnecting.data === "ImportRunning" ? "ImportRunning" : undefined;
  })();

  return {
    open: () => {
      disconnecting.reset();
      opening.mutate();
    },
    opening: opening.isPending,
    disconnect: () => {
      opening.reset();
      disconnecting.mutate();
    },
    disconnecting: disconnecting.isPending,
    failure,
  };
};
