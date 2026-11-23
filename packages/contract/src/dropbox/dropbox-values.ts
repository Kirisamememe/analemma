import { z } from "zod";

import { imageId } from "../images/image-values";

/** Dropbox の認可の画面から戻る、管理画面の path。 */
export const DROPBOX_REDIRECT_PATH = "/images/dropbox/callback";

/** Dropbox のファイルの ID。 */
export const dropboxFileId = z
  .string()
  .regex(/^id:[\w\-]{1,128}$/v)
  .describe(
    "Dropbox のファイルの ID(id: で始まる)。移しても名前を変えても変わらない。",
  );

/** Dropbox との接続の状態。 */
export const dropboxConnection = z.discriminatedUnion("status", [
  z.object({
    status: z
      .literal("unconfigured")
      .describe("server に Dropbox のアプリの app key と app secret が無い。"),
  }),
  z.object({
    status: z
      .literal("disconnected")
      .describe("どのアカウントにもつないでいない。"),
  }),
  z.object({
    status: z.literal("connected").describe("アカウントにつないでいる。"),
    accountName: z.string().describe("つないだアカウントの表示名。"),
    accountEmail: z.string().describe("つないだアカウントのメールアドレス。"),
    connectedAt: z.iso.datetime({ offset: true }).describe("つないだ日時。"),
  }),
]);

/** Dropbox の App folder にある、取り込める写真。 */
export const dropboxPhoto = z.object({
  id: dropboxFileId,
  path: z
    .string()
    .startsWith("/")
    .describe("App folder の中のパス(Dropbox に見える大文字と小文字)。"),
  size: z.int().nonnegative().describe("ファイルの大きさ(bytes)。"),
  modifiedAt: z.iso
    .datetime({ offset: true })
    .describe("Dropbox でファイルが最後に変わった日時。"),
  imported: z
    .object({
      imageId: imageId
        .nullable()
        .describe("取り込んで作った画像の ID。画像を消していれば null。"),
      importedAt: z.iso.datetime({ offset: true }).describe("取り込んだ日時。"),
    })
    .nullable()
    .describe("同じ中身の写真を取り込んだ記録。まだなら null。"),
});
