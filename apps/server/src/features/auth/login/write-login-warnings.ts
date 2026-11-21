import type { Logger } from "../../../platform/logger";
import type { VerifiedLogin } from "./verify-login";

/** 確かめたログインか再認証の、拒まずに知らせることを logger に書く。 */
export const writeLoginWarnings = (
  logger: Logger,
  verified: VerifiedLogin,
): void => {
  const details = { passkeyId: verified.passkey.id };

  if (verified.counterWentBack) {
    logger.write({
      level: "warn",
      message: "パスキーの signCount が戻った",
      details,
    });
  }

  if (verified.backupEligibilityChanged) {
    logger.write({
      level: "warn",
      message: "パスキーの BE が、登録したときと変わった",
      details,
    });
  }
};
