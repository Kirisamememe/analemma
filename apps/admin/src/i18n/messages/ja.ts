import type { Translation } from "../translation";

/** 日本語の訳。 */
export const ja = {
  "app.name": "Stilus",
  "home.title": "Stilus",
  "notFound.title": "ページが見つかりません",
  "notFound.description": "{path} にページはありません。",
  "notFound.backHome": "ホームに戻る",
  "ui.pending": "処理中",
  "login.title": "Stilus にログイン",
  "login.description": "この管理画面に登録したパスキーを使います。",
  "login.submit": "パスキーでログイン",
  "login.cancelled": "ログインをキャンセルしました。",
  "login.expired": "時間がかかりすぎました。もう一度ログインしてください。",
  "login.unknownPasskey":
    "このパスキーは登録されていません。削除されたパスキーかもしれません。",
  "login.rejected": "パスキーを確認できませんでした。",
  "login.failed":
    "ログインできませんでした。時間をおいて、もう一度試してください。",
  "enroll.title": "パスキーを登録",
  "enroll.description": "この管理画面にログインするためのパスキーを作ります。",
  "enroll.name": "パスキーの名前",
  "enroll.nameDescription": "パスキーを見分けるための名前(端末の名前など)。",
  "enroll.submit": "パスキーを登録",
  "enroll.missingToken":
    "登録用 URL が不完全です。サーバーのコマンドで発行し直してください。",
  "enroll.cancelled": "登録をキャンセルしました。",
  "enroll.invalid":
    "この登録用 URL は使えません。期限切れか、使用済みの可能性があります。サーバーのコマンドで発行し直してください。",
  "enroll.expired": "時間がかかりすぎました。もう一度登録してください。",
  "enroll.alreadyRegistered":
    "この認証器には、この管理画面のパスキーがもうあります。そのパスキーでログインしてください。",
  "enroll.rejected": "パスキーを登録できませんでした。",
  "enroll.failed":
    "登録できませんでした。時間をおいて、もう一度試してください。",
  "enroll.signIn": "ログイン画面へ",
  "session.logOut": "ログアウト",
  "session.logOutFailed":
    "ログアウトできませんでした。もう一度試してください。",
  "sessionError.title": "サーバーにつながりません",
  "sessionError.description":
    "ログイン状態を確認できませんでした。もう一度試してください。",
  "sessionError.retry": "もう一度試す",
  "passkeyName.invalid": "1〜64文字で、改行などを使わずに付けてください。",
} satisfies Translation;
