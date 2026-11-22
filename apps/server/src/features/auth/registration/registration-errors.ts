import type { RegistrationFailure } from "@/features/auth/registration/verify-passkey-registration";

/** 登録を受け付けなかった理由ごとの、contract の失敗の名前。 */
export const REGISTRATION_ERRORS = {
  ChallengeExpired: "CHALLENGE_EXPIRED",
  InvalidCredential: "INVALID_CREDENTIAL",
} as const satisfies Record<RegistrationFailure["_tag"], string>;
