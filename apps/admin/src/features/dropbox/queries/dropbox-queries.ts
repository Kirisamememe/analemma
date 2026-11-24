import type { ApiClient, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** Dropbox との接続の状態。 */
export type DropboxConnection = ApiOutputs["admin"]["dropbox"]["get"];

/** App folder の写真。 */
export type DropboxPhoto =
  ApiOutputs["admin"]["dropbox"]["photos"]["photos"][number];

/** 取り込むために選んだ写真(ID と、選んだときの content_hash)。 */
export type DropboxSelection = Pick<DropboxPhoto, "id" | "contentHash">;

/** 1回の取り込みの進み具合。 */
export type DropboxImport = NonNullable<
  ApiOutputs["admin"]["dropbox"]["getImport"]
>;

/** App folder の写真を読んだ結果。 */
export type DropboxPhotos =
  | {
      /** どの結果か。 */
      readonly _tag: "Listed";
      /** 写真(Dropbox で新しく変わった順)。 */
      readonly photos: readonly DropboxPhoto[];
    }
  | {
      /** どの結果か。 */
      readonly _tag: "NotConnected" | "ConnectionLost";
    };

/** Dropbox との接続の状態の、query のキー。 */
export const DROPBOX_CONNECTION_KEY = ["admin", "dropbox", "get"] as const;

/** App folder の写真の、query のキー。 */
export const DROPBOX_PHOTOS_KEY = ["admin", "dropbox", "photos"] as const;

/** 取り込みの進み具合の、query のキー。 */
export const DROPBOX_IMPORT_KEY = ["admin", "dropbox", "getImport"] as const;

/** Dropbox との接続の状態を読む。 */
export const loadDropboxConnection = (api: ApiClient) =>
  api.admin.dropbox.get();

/** App folder の写真を、取り込んだ記録と合わせて読む。 */
export const loadDropboxPhotos = async (
  api: ApiClient,
): Promise<DropboxPhotos> => {
  const result = await callApi(api.admin.dropbox.photos(), [
    "NOT_CONNECTED",
    "CONNECTION_LOST",
  ]);

  if (result._tag === "Succeeded") {
    return { _tag: "Listed", photos: result.data.photos };
  }

  return {
    _tag: result.code === "NOT_CONNECTED" ? "NotConnected" : "ConnectionLost",
  };
};

/** 最後に始めた取り込みの進み具合を読む。 */
export const loadDropboxImport = (api: ApiClient) =>
  api.admin.dropbox.getImport();
