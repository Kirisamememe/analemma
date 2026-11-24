import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";
import type {
  DropboxConnection,
  DropboxImport,
  DropboxSelection,
} from "@/features/dropbox/queries/dropbox-queries";

/** 認可の画面を開く準備をした結果。 */
export type AuthorizeResult =
  | {
      /** どの結果か。 */
      readonly _tag: "Opened";
      /** Dropbox の認可の画面の URL。 */
      readonly url: string;
    }
  | {
      /** どの結果か。 */
      readonly _tag: "NotConfigured" | "AlreadyConnected";
    };

/** Dropbox から戻った code でつないだ結果。 */
export type ConnectResult =
  | {
      /** どの結果か。 */
      readonly _tag: "Connected";
      /** つないだ後の接続の状態。 */
      readonly connection: DropboxConnection;
    }
  | {
      /** どの結果か。 */
      readonly _tag:
        | "NotConfigured"
        | "AlreadyConnected"
        | "Expired"
        | "Rejected";
    };

/** Dropbox の認可の画面から戻った URL に付いた値。 */
export type DropboxReturn = {
  /** Dropbox が付けた code。 */
  readonly code: string;
  /** 認可を始めたときの state。 */
  readonly state: string;
};

/** 取り込みを始めた結果。 */
export type StartImportResult =
  | {
      /** どの結果か。 */
      readonly _tag: "Started";
      /** 始めた取り込み。 */
      readonly run: DropboxImport;
    }
  | {
      /** どの結果か。 */
      readonly _tag: "NotConnected" | "ConnectionLost" | "ImportRunning";
    };

const CONNECT_FAILURES = {
  NOT_CONFIGURED: "NotConfigured",
  ALREADY_CONNECTED: "AlreadyConnected",
  AUTHORIZATION_EXPIRED: "Expired",
  AUTHORIZATION_REJECTED: "Rejected",
} as const;

const IMPORT_FAILURES = {
  NOT_CONNECTED: "NotConnected",
  CONNECTION_LOST: "ConnectionLost",
  IMPORT_RUNNING: "ImportRunning",
} as const;

/** Dropbox の認可の画面の URL を作らせる。 */
export const authorizeDropbox = async (
  api: ApiClient,
): Promise<AuthorizeResult> => {
  const result = await callApi(api.admin.dropbox.authorize(), [
    "NOT_CONFIGURED",
    "ALREADY_CONNECTED",
  ]);

  if (result._tag === "Succeeded") {
    return { _tag: "Opened", url: result.data.url };
  }

  return {
    _tag:
      result.code === "NOT_CONFIGURED" ? "NotConfigured" : "AlreadyConnected",
  };
};

/** Dropbox から戻った code と state で、アカウントにつなぐ。 */
export const connectDropbox = async (
  api: ApiClient,
  returned: DropboxReturn,
): Promise<ConnectResult> => {
  const result = await callApi(api.admin.dropbox.connect({ ...returned }), [
    "NOT_CONFIGURED",
    "ALREADY_CONNECTED",
    "AUTHORIZATION_EXPIRED",
    "AUTHORIZATION_REJECTED",
  ]);

  return result._tag === "Succeeded"
    ? { _tag: "Connected", connection: result.data }
    : { _tag: CONNECT_FAILURES[result.code] };
};

/** Dropbox との接続を切る。 */
export const disconnectDropbox = async (
  api: ApiClient,
): Promise<"Disconnected" | "ImportRunning"> => {
  const result = await callApi(api.admin.dropbox.disconnect(), [
    "IMPORT_RUNNING",
  ]);

  return result._tag === "Succeeded" ? "Disconnected" : "ImportRunning";
};

/** 選んだ写真の取り込みを始める。 */
export const startDropboxImport = async (
  api: ApiClient,
  selected: readonly DropboxSelection[],
): Promise<StartImportResult> => {
  const result = await callApi(
    api.admin.dropbox.startImport({ photos: [...selected] }),
    ["NOT_CONNECTED", "CONNECTION_LOST", "IMPORT_RUNNING"],
  );

  return result._tag === "Succeeded"
    ? { _tag: "Started", run: result.data }
    : { _tag: IMPORT_FAILURES[result.code] };
};
