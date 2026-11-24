import { z } from "zod";

/** Dropbox の認可の画面から戻る、管理画面の path。 */
export const DROPBOX_REDIRECT_PATH = "/images/dropbox/callback";

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
