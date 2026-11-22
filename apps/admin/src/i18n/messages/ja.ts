import type { Translation } from "../translation";

/** 日本語の訳。 */
export const ja = {
  "app.name": "Stilus",
  "home.title": "Stilus",
  "notFound.title": "ページが見つかりません",
  "notFound.description": "{{path}} にページはありません。",
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
  "home.security": "セキュリティ",
  "security.title": "セキュリティ",
  "security.description":
    "この管理画面へのログインに使う、パスキーとセッション。",
  "passkeys.title": "パスキー",
  "passkeys.add": "パスキーを追加",
  "passkeys.addDescription":
    "まず登録済みのパスキーで本人確認をしてから、新しいパスキーを作ります。",
  "passkeys.dates": "登録 {{created}}・最終使用 {{lastUsed}}",
  "passkeys.synced": "同期済み",
  "passkeys.rename": "名前を変更",
  "passkeys.renameTitle": "パスキーの名前を変更",
  "passkeys.delete": "削除",
  "passkeys.deleteTitle": "「{{name}}」を削除しますか?",
  "passkeys.deleteDescription":
    "登録済みのパスキーで本人確認をしてから削除します。ほかのブラウザからはログアウトします。",
  "passkeys.cancel": "キャンセル",
  "passkeys.save": "保存",
  "passkeys.loading": "パスキーを読み込んでいます。",
  "passkeys.loadFailed": "パスキーを読み込めませんでした。",
  "passkeys.added": "パスキーを追加しました。",
  "passkeys.deleted":
    "パスキーを削除しました。ほかのブラウザからはログアウトしました。",
  "passkeys.cancelled": "パスキーの操作をキャンセルしました。",
  "passkeys.reauthenticationFailed": "本人確認ができませんでした。",
  "passkeys.expired": "時間がかかりすぎました。もう一度試してください。",
  "passkeys.alreadyRegistered":
    "この認証器には、この管理画面のパスキーがもうあります。",
  "passkeys.rejected": "パスキーを登録できませんでした。",
  "passkeys.lastPasskey": "最後のパスキーは削除できません。",
  "passkeys.notFound": "このパスキーはもうありません。",
  "passkeys.failed":
    "操作できませんでした。時間をおいて、もう一度試してください。",
  "sessions.title": "セッション",
  "sessions.description":
    "このブラウザを含む、すべてのブラウザからログアウトします。",
  "sessions.logOutAll": "すべてのセッションからログアウト",
  "sessions.logOutAllTitle": "すべてのセッションからログアウトしますか?",
  "sessions.logOutAllFailed":
    "ログアウトできませんでした。もう一度試してください。",
  "passkeys.renamed": "パスキーの名前を変更しました。",
} satisfies Translation;
