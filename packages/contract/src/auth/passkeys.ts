import { z } from "zod";

import { adminAccess, reauthenticatedAccess } from "../access-errors";
import {
  credentialId,
  passkeyName,
  reauthenticationAssertion,
  registrationCredential,
  registrationOptions,
} from "./webauthn";

const passkeySummary = z.object({
  id: credentialId,
  name: passkeyName,
  createdAt: z.iso.datetime({ offset: true }).describe("登録した日時。"),
  lastUsedAt: z.iso
    .datetime({ offset: true })
    .describe("最後に登録かログインに使った日時。"),
  backedUp: z.boolean().describe("ほかの端末へ同期されているか。"),
});

const registration = reauthenticatedAccess.errors({
  CHALLENGE_EXPIRED: { status: 400 },
  INVALID_CREDENTIAL: { status: 400 },
  DUPLICATE_CREDENTIAL: { status: 409 },
});

/** 管理者のパスキーを扱う procedure の contract。 */
export const passkeys = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/passkeys",
      summary: "パスキーの一覧",
    })
    .output(z.object({ passkeys: z.array(passkeySummary) })),
  registrationOptions: adminAccess
    .route({
      method: "POST",
      path: "/admin/passkeys/registration-options",
      summary: "パスキーを足すための、登録の options",
    })
    .output(registrationOptions),
  register: registration
    .route({
      method: "POST",
      path: "/admin/passkeys",
      summary: "パスキーを足す",
    })
    .input(
      z.object({
        name: passkeyName,
        credential: registrationCredential,
        assertion: reauthenticationAssertion,
      }),
    )
    .output(passkeySummary),
  rename: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/passkeys/rename",
      summary: "パスキーの名前を変える",
    })
    .input(z.object({ id: credentialId, name: passkeyName }))
    .output(passkeySummary),
  delete: reauthenticatedAccess
    .errors({ NOT_FOUND: { status: 404 }, LAST_PASSKEY: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/passkeys/delete",
      summary: "パスキーを消す(最後の1つは消せない)",
    })
    .input(z.object({ id: credentialId, assertion: reauthenticationAssertion }))
    .output(z.void()),
};
