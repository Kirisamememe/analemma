import { oc } from "@orpc/contract";

/** ログイン中の管理者だけが呼べる procedure の、共通の失敗。 */
export const adminAccess = oc.errors({
  UNAUTHORIZED: { status: 401 },
  FORBIDDEN: { status: 403 },
});

/** セッション無しで呼ぶ認証用の procedure の、共通の失敗。 */
export const authAccess = oc.errors({
  FORBIDDEN: { status: 403 },
});

/** 再認証を求める、管理者の procedure の共通の失敗。 */
export const reauthenticatedAccess = adminAccess.errors({
  REAUTHENTICATION_FAILED: { status: 403 },
});

/** デプロイ用のトークンで呼ぶ procedure の、共通の失敗。 */
export const deployAccess = oc.errors({
  UNAUTHORIZED: { status: 401 },
});
