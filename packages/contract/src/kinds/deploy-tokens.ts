import { z } from "zod";

import { adminAccess, reauthenticatedAccess } from "../access-errors";
import { reauthenticationAssertion } from "../webauthn";

/** デプロイ用のトークンに付ける名前。 */
export const deployTokenName = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^\P{Cc}*$/v, { error: "制御文字は使えない" })
  .describe("管理画面で見分けるための、トークンの名前。");

const tokenId = z
  .string()
  .regex(/^[A-Za-z0-9_\-]{22}$/v)
  .describe("トークンの前半の ID。");

const tokenSummary = z.object({
  id: tokenId,
  name: deployTokenName,
  createdAt: z.iso.datetime({ offset: true }).describe("発行した日時。"),
  lastUsedAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("最後に定義を送った日時。"),
});

/** 管理者がデプロイ用のトークンを扱う procedure の contract。 */
export const deployTokens = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/deploy-tokens",
      summary: "デプロイ用のトークンの一覧",
    })
    .output(z.object({ tokens: z.array(tokenSummary) })),
  issue: reauthenticatedAccess
    .route({
      method: "POST",
      path: "/admin/deploy-tokens",
      summary: "今のパスキーで確かめ直してから、デプロイ用のトークンを発行する",
    })
    .input(
      z.object({ name: deployTokenName, assertion: reauthenticationAssertion }),
    )
    .output(
      tokenSummary.extend({
        token: z
          .string()
          .describe(
            "`{id}.{secret}` の token。返すのは発行したときの1回だけ。",
          ),
      }),
    ),
  revoke: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/deploy-tokens/revoke",
      summary: "デプロイ用のトークンを取り消す",
    })
    .input(z.object({ id: tokenId }))
    .output(z.void()),
};
