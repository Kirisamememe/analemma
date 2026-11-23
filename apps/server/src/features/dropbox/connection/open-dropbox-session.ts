import type { AppContext } from "@/context";
import {
  deleteDropboxConnection,
  readDropboxConnection,
} from "@/features/dropbox/connection/queries/dropbox-connection.query";
import type { DropboxApi } from "@/platform/dropbox/dropbox-api";

/** つないだアカウントで API を呼ぶための access token を渡すもの。 */
export type DropboxSession = {
  /** Dropbox の API を呼ぶ client。 */
  readonly api: DropboxApi;
  /** 切れる前に作り直した access token(接続が切れたら undefined)。 */
  readonly accessToken: () => Promise<string | undefined>;
};

/** 接続を開けた結果。 */
export type OpenedDropboxSession =
  | {
      /** どの結果か。 */
      readonly _tag: "Opened";
      /** つないだアカウントの session。 */
      readonly session: DropboxSession;
    }
  | {
      /** app key と app secret が無い。 */
      readonly _tag: "NotConfigured";
    }
  | {
      /** どのアカウントにもつないでいない。 */
      readonly _tag: "NotConnected";
    }
  | {
      /** refresh token が使えなくなったので、接続の行を消した。 */
      readonly _tag: "ConnectionLost";
    };

const REFRESH_MARGIN_MS = 5 * 60 * 1000; // 切れる5分前に作り直す
const MS_PER_SECOND = 1000;

/** 接続の行の refresh token で、つないだアカウントの session を開く。 */
export const openDropboxSession = async (
  context: Pick<AppContext, "clock" | "db" | "dropbox">,
  signal?: AbortSignal,
): Promise<OpenedDropboxSession> => {
  const { api } = context.dropbox;

  if (api === undefined) return { _tag: "NotConfigured" };

  const row = await readDropboxConnection(context.db);

  if (row === undefined) return { _tag: "NotConnected" };

  const refresh = async (abort?: AbortSignal) => {
    const refreshed = await api.refresh(row.refreshToken, abort);

    if (refreshed._tag === "Revoked") {
      await deleteDropboxConnection(context.db, row);

      return undefined;
    }

    return {
      token: refreshed.accessToken,
      expiresAt:
        context.clock.now().getTime() +
        refreshed.expiresInSeconds * MS_PER_SECOND,
    };
  };

  let current = await refresh(signal);

  if (current === undefined) return { _tag: "ConnectionLost" };

  return {
    _tag: "Opened",
    session: {
      api,
      accessToken: async () => {
        if (
          current !== undefined &&
          current.expiresAt - REFRESH_MARGIN_MS <= context.clock.now().getTime()
        ) {
          current = await refresh();
        }

        return current?.token;
      },
    },
  };
};
