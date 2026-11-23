import { z } from "zod";

import { adminAccess } from "../access-errors";

/** Dropbox とのつながり。 */
const dropboxConnection = z.object({
  available: z
    .boolean()
    .describe("server に Dropbox のアプリを設定してあるか。"),
  connectedAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("Dropbox とつないだ日時。つないでいなければ null。"),
});

const notConfigured = adminAccess.errors({ NOT_CONFIGURED: { status: 409 } });

/** 管理者が Dropbox とつなぐ procedure の contract。 */
export const dropbox = {
  get: adminAccess
    .route({
      method: "GET",
      path: "/admin/dropbox",
      summary: "Dropbox とのつながり",
    })
    .output(dropboxConnection),
  authorize: notConfigured
    .route({
      method: "POST",
      path: "/admin/dropbox/authorize",
      summary: "Dropbox とつなぐことを許す、Dropbox の画面の URL を出す",
    })
    .output(
      z.object({
        url: z.url().describe("Dropbox の、許可を求める画面の URL。"),
      }),
    ),
  connect: notConfigured
    .errors({ AUTHORIZATION_FAILED: { status: 400 } })
    .route({
      method: "POST",
      path: "/admin/dropbox/connect",
      summary: "Dropbox の許可の画面から戻った code で、Dropbox とつなぐ",
    })
    .input(
      z.object({
        code: z
          .string()
          .min(1)
          .max(1024)
          .describe("Dropbox が戻り先に付けた code。"),
        state: z
          .string()
          .min(1)
          .max(256)
          .describe("Dropbox が戻り先に付けた state。"),
      }),
    )
    .output(dropboxConnection),
  disconnect: adminAccess
    .route({
      method: "POST",
      path: "/admin/dropbox/disconnect",
      summary: "Dropbox とのつながりを切る",
    })
    .output(dropboxConnection),
};
