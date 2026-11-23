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

/** 取り込む写真1枚の状態。 */
export const dropboxImportStatus = z
  .enum([
    "waiting",
    "importing",
    "added",
    "already-added",
    "not-found",
    "too-large",
    "unsupported",
    "failed",
  ])
  .describe(
    "waiting は順番を待っている、importing は読んで変換している、added は画像を作った、already-added は同じ中身の写真を取り込み済み、not-found は Dropbox に無い、too-large は大きすぎる、unsupported は形式に対応していない、failed は想定外の失敗。",
  );

/** 1回の取り込みの進み具合。 */
export const dropboxImport = z.object({
  startedAt: z.iso.datetime({ offset: true }).describe("始めた日時。"),
  finishedAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("すべての写真を終えた日時。まだなら null。"),
  photos: z
    .array(
      z.object({
        id: dropboxFileId,
        path: z
          .string()
          .describe("App folder の中のパス。Dropbox に無ければ空の文字列。"),
        status: dropboxImportStatus,
        imageId: imageId
          .nullable()
          .describe(
            "作った画像か、同じ中身で取り込み済みの画像の ID。無ければ null。",
          ),
      }),
    )
    .describe("選んだ順の写真。"),
});

/** 1回の取り込みの進み具合の値。 */
export type DropboxImport = z.output<typeof dropboxImport>;
