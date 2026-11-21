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
  "home.security": "セキュリティ",
  "security.title": "セキュリティ",
  "security.description":
    "この管理画面へのログインに使う、パスキーとセッション。",
  "passkeys.title": "パスキー",
  "passkeys.add": "パスキーを足す",
  "passkeys.addDescription":
    "まず今のパスキーで確かめ、それから新しいパスキーを作ります。",
  "passkeys.created": "登録 {date}",
  "passkeys.lastUsed": "最後に使用 {date}",
  "passkeys.synced": "同期済み",
  "passkeys.rename": "名前を変える",
  "passkeys.renameTitle": "パスキーの名前を変える",
  "passkeys.delete": "消す",
  "passkeys.deleteTitle": "「{name}」を消しますか?",
  "passkeys.deleteDescription":
    "今のパスキーで確かめてから消します。ほかのブラウザのログインは終わります。",
  "passkeys.cancel": "やめる",
  "passkeys.save": "保存",
  "passkeys.loading": "パスキーを読み込んでいます。",
  "passkeys.loadFailed": "パスキーを読み込めませんでした。",
  "passkeys.added": "パスキーを足しました。",
  "passkeys.deleted":
    "パスキーを消しました。ほかのブラウザのログインは終わりました。",
  "passkeys.cancelled": "パスキーの操作を取り消しました。",
  "passkeys.reauthenticationFailed": "今のパスキーで確かめられませんでした。",
  "passkeys.expired": "時間がかかりすぎました。もう一度試してください。",
  "passkeys.alreadyRegistered":
    "この認証器には、この管理画面のパスキーがもうあります。",
  "passkeys.rejected": "パスキーを登録できませんでした。",
  "passkeys.lastPasskey": "最後のパスキーは消せません。",
  "passkeys.notFound": "このパスキーはもうありません。",
  "passkeys.failed":
    "うまくいきませんでした。時間をおいて、もう一度試してください。",
  "sessions.title": "セッション",
  "sessions.description":
    "この画面を含む、すべてのブラウザからログアウトします。",
  "sessions.logOutAll": "すべてのセッションからログアウト",
  "sessions.logOutAllTitle": "すべてのセッションからログアウトしますか?",
  "sessions.logOutAllFailed":
    "ログアウトできませんでした。もう一度試してください。",
} satisfies Translation;
