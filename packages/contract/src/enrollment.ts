import { z } from "zod";

import { authAccess } from "./access-errors";
import { sessionExpiry } from "./session";
import {
  passkeyName,
  registrationCredential,
  registrationOptions,
} from "./webauthn";

const enrollmentToken = z
  .string()
  .min(1)
  .max(128)
  .describe("コマンドが出した登録用 URL の、# の後ろの token。");

const enrollmentAccess = authAccess.errors({
  INVALID_ENROLLMENT: { status: 403 },
});

/** 登録用 URL からパスキーを登録する procedure の contract。 */
export const enrollment = {
  options: enrollmentAccess
    .route({
      method: "POST",
      path: "/auth/enrollment/options",
      summary: "登録用 URL からの登録の options",
    })
    .input(z.object({ token: enrollmentToken }))
    .output(registrationOptions),
  register: enrollmentAccess
    .errors({
      CHALLENGE_EXPIRED: { status: 400 },
      INVALID_CREDENTIAL: { status: 400 },
      DUPLICATE_CREDENTIAL: { status: 409 },
    })
    .route({
      method: "POST",
      path: "/auth/enrollment",
      summary: "登録用 URL からパスキーを登録してログインする",
    })
    .input(
      z.object({
        token: enrollmentToken,
        name: passkeyName,
        credential: registrationCredential,
      }),
    )
    .output(sessionExpiry),
};
