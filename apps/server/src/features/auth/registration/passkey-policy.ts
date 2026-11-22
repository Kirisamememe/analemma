import {
  COSE_ALGORITHM,
  type CoseAlgorithm,
} from "@/features/auth/webauthn/cose-key/cose-algorithm";

/** パスワードマネージャーに出るサイトの名前。 */
export const RP_NAME = "Analemma";

/** パスワードマネージャーに出る、管理者の名前。 */
export const ADMIN_USER_NAME = "admin";

/** 画面に出す、管理者の名前。 */
export const ADMIN_DISPLAY_NAME = "管理者";

/** 登録の options に、好む順に並べる COSE のアルゴリズム。 */
export const PASSKEY_ALGORITHMS: readonly CoseAlgorithm[] = [
  COSE_ALGORITHM.EdDSA,
  COSE_ALGORITHM.ES256,
  COSE_ALGORITHM.RS256,
];
