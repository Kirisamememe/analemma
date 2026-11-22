import type { Translation } from "@/i18n/translation";

/** 日本語の訳。 */
export const ja = {
  "app.name": "Stilus",
  "home.title": "ホーム",
  "navigation.main": "メイン",
  "navigation.drawer": "ナビ",
  "navigation.settings": "設定",
  "notFound.title": "ページが見つかりません",
  "notFound.description": "{{path}} にページはありません。",
  "notFound.backHome": "ホームに戻る",
  "ui.pending": "処理中",
  "ui.dateField.incomplete": "年・月・日を入力してください。",
  "ui.numberField.decrease": "{{label}}の値を減らす",
  "ui.numberField.increase": "{{label}}の値を増やす",
  "ui.select.none": "選択なし",
  "ui.select.placeholder": "選択してください",
  "ui.openNav": "ナビを開く",
  "ui.closeNav": "ナビを閉じる",
  "ui.close": "閉じる",
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
  "deployTokens.title": "デプロイ用のトークン",
  "deployTokens.description":
    "公開サイトのデプロイで、種類の定義を送るときに使うトークン。トークンの値は、発行した直後に一度だけ表示します。",
  "deployTokens.listTitle": "発行したトークン",
  "deployTokens.issue": "トークンを発行",
  "deployTokens.issueDescription":
    "どこで使うかが分かる名前を付けます。発行の前に、登録済みのパスキーで本人確認をします。",
  "deployTokens.name": "トークンの名前",
  "deployTokens.nameDescription": "例:本番のデプロイ",
  "deployTokens.invalidName": "1〜64文字で、改行などを使わずに付けてください。",
  "deployTokens.cancel": "キャンセル",
  "deployTokens.issued": "「{{name}}」を発行しました。",
  "deployTokens.issuedTitle": "新しいトークンをコピー",
  "deployTokens.shownOnce":
    "トークンの値を表示するのは今だけです。閉じる前にコピーしてください。",
  "deployTokens.value": "「{{name}}」のトークン",
  "deployTokens.copy": "コピー",
  "deployTokens.copied": "トークンをクリップボードにコピーしました。",
  "deployTokens.copyFailed":
    "コピーできませんでした。トークンを選んで、手でコピーしてください。",
  "deployTokens.close": "閉じる",
  "deployTokens.dates": "発行 {{created}}・最終使用 {{lastUsed}}",
  "deployTokens.datesUnused": "発行 {{created}}・未使用",
  "deployTokens.loading": "トークンを読み込んでいます。",
  "deployTokens.loadFailed": "トークンを読み込めませんでした。",
  "deployTokens.empty":
    "まだトークンはありません。公開サイトのデプロイに使うトークンを発行してください。",
  "deployTokens.revoke": "取り消す",
  "deployTokens.revokeTitle": "「{{name}}」を取り消しますか?",
  "deployTokens.revokeDescription":
    "このトークンを使うデプロイは、種類の定義を送れなくなります。取り消したトークンは元に戻せません。",
  "deployTokens.revoked": "「{{name}}」を取り消しました。",
  "deployTokens.cancelled": "トークンの発行をキャンセルしました。",
  "deployTokens.reauthenticationFailed": "本人確認ができませんでした。",
  "deployTokens.notFound": "このトークンはもうありません。",
  "deployTokens.failed":
    "操作できませんでした。時間をおいて、もう一度試してください。",
} satisfies Translation;
