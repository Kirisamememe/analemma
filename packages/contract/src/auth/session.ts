import { z } from "zod";

import { adminAccess } from "../access-errors";
import { authenticationOptions } from "./webauthn";

/** セッションが切れる日時。 */
export const sessionExpiry = z.object({
  expiresAt: z.iso
    .datetime({ offset: true })
    .describe("セッションが切れる日時。"),
});

/** 管理者のセッションを扱う procedure の contract。 */
export const session = {
  get: adminAccess
    .route({ method: "GET", path: "/admin/session", summary: "今のセッション" })
    .output(sessionExpiry),
  reauthenticationOptions: adminAccess
    .route({
      method: "POST",
      path: "/admin/session/reauthentication-options",
      summary: "今のパスキーで確かめ直す、再認証の options",
    })
    .output(authenticationOptions),
  logOut: adminAccess
    .route({
      method: "POST",
      path: "/admin/session/log-out",
      summary: "ログアウト",
    })
    .output(z.void()),
  logOutAll: adminAccess
    .route({
      method: "POST",
      path: "/admin/session/log-out-all",
      summary: "すべてのセッションからログアウトする",
    })
    .output(
      z.object({
        loggedOut: z
          .number()
          .int()
          .min(0)
          .describe("ログアウトしたセッションの数。"),
      }),
    ),
};
