import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import type { CallbackSearch } from "@/features/dropbox/logic/callback-search";
import {
  type ConnectResult,
  type DropboxReturn,
  connectDropbox,
} from "@/features/dropbox/queries/dropbox-actions";
import { DROPBOX_CONNECTION_KEY } from "@/features/dropbox/queries/dropbox-queries";

/** Dropbox から戻った画面の状態。 */
export type ReturnState =
  | Exclude<ConnectResult["_tag"], "Connected">
  | "Ready"
  | "Connecting"
  | "Connected"
  | "Denied"
  | "Invalid"
  | "Failed";

/** Dropbox から戻った画面の状態と、つなぐ操作。 */
export type ConnectReturned = {
  /** 画面の状態。 */
  readonly state: ReturnState;
  /** 戻った code と state で、アカウントにつなぐ。 */
  readonly connect: () => void;
};

/** Dropbox の認可の画面から戻った code で、アカウントにつなぐ操作を返す。 */
export const useConnectReturned = (
  search: CallbackSearch,
  onConnected: () => void,
): ConnectReturned => {
  const { api } = useAppContext();
  const cache = useApiCache();

  const { mutate, data, isError, isPending } = useApiMutation({
    key: ["admin", "dropbox", "connect"],
    send: async (returned: DropboxReturn) => connectDropbox(api, returned),
    onSuccess: async (result) => {
      if (result._tag !== "Connected") return;

      await cache.replace(DROPBOX_CONNECTION_KEY, result.connection);
      onConnected();
    },
  });

  const state = ((): ReturnState => {
    if (search._tag !== "Approved") return search._tag;

    if (isPending) return "Connecting";

    if (isError) return "Failed";

    return data?._tag ?? "Ready";
  })();

  return {
    state,
    connect: () => {
      if (search._tag === "Approved" && state === "Ready") {
        mutate({ code: search.code, state: search.state });
      }
    },
  };
};
