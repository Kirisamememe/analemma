import { z } from "zod";

import { adminAccess } from "../access-errors";
import { dropboxConnection } from "./dropbox-values";

const NOT_CONFIGURED = { NOT_CONFIGURED: { status: 409 } };

/** 管理画面で Dropbox につなぎ、写真を取り込む procedure の contract。 */
export const dropbox = {
  get: adminAccess
    .route({
      method: "GET",
      path: "/admin/dropbox",
      summary: "Dropbox との接続の状態",
    })
    .output(dropboxConnection),
  authorize: adminAccess
    .errors({ ...NOT_CONFIGURED, ALREADY_CONNECTED: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/dropbox/authorize",
      summary: "Dropbox の認可の画面の URL を作る(10分だけ使える)",
    })
    .output(z.object({ url: z.url({ protocol: /^https$/v }) })),
  connect: adminAccess
    .errors({
      ...NOT_CONFIGURED,
      ALREADY_CONNECTED: { status: 409 },
      AUTHORIZATION_EXPIRED: { status: 400 },
      AUTHORIZATION_REJECTED: { status: 400 },
    })
    .route({
      method: "POST",
      path: "/admin/dropbox/connect",
      summary: "Dropbox の認可の画面から戻った code で、アカウントにつなぐ",
    })
    .input(
      z.object({
        code: z.string().min(1).max(1000),
        state: z.string().min(1).max(200),
      }),
    )
    .output(dropboxConnection),
  disconnect: adminAccess
    .errors(NOT_CONFIGURED)
    .route({
      method: "POST",
      path: "/admin/dropbox/disconnect",
      summary: "Dropbox との接続を切り、Dropbox に預けた認可を取り消す",
    })
    .output(z.void()),
};
