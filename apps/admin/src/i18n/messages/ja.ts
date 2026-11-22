import type { Translation } from "@/i18n/translation";

/** 日本語の訳。 */
export const ja = {
  "app.name": "Stilus",
  "home.title": "ホーム",
  "navigation.main": "メイン",
  "navigation.drawer": "ナビ",
  "navigation.settings": "設定",
  "navigation.content": "コンテンツ",
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
  "fixedPages.title": "固定ページ",
  "fixedPages.description": "About など、公開サイトに置くページ。",
  "fixedPages.loading": "固定ページを読み込んでいます。",
  "fixedPages.loadFailed": "固定ページを読み込めませんでした。",
  "fixedPages.emptyTitle": "固定ページはまだありません",
  "fixedPages.emptyDescription": "作った固定ページは、ここに並びます。",
  "fixedPages.reorderHint":
    "左の取っ手をドラッグすると、並び順を変えられます。",
  "fixedPages.savingOrder": "並び順を保存しています",
  "fixedPages.reordered": "並び順を保存しました。",
  "fixedPages.orderMismatch":
    "ほかで固定ページが増えたか減ったため、並び順を保存できませんでした。一覧を読み込み直したので、もう一度並べ直してください。",
  "fixedPages.reorderFailed":
    "並び順を保存できませんでした。もう一度試してください。",
  "fixedPages.published": "公開中",
  "fixedPages.unpublished": "非公開",
  "fixedPages.details": "{{slug}}・{{kind}}・{{updated}} に更新",
  "fixedPages.publish": "公開する",
  "fixedPages.unpublish": "非公開にする",
  "fixedPages.publishDone": "「{{title}}」を公開しました。",
  "fixedPages.unpublishDone": "「{{title}}」を非公開にしました。",
  "fixedPages.gone":
    "「{{title}}」はもうありません。一覧を読み込み直しました。",
  "fixedPages.publicationFailed":
    "「{{title}}」の公開状態を変えられませんでした。もう一度試してください。",
  "fixedPages.delete": "削除",
  "fixedPages.deleteTitle": "「{{title}}」を削除しますか?",
  "fixedPages.deleteDescription":
    "削除した固定ページは元に戻せません。公開サイトからも見えなくなります。",
  "fixedPages.cancel": "キャンセル",
  "fixedPages.deleted": "「{{title}}」を削除しました。",
  "fixedPages.notFound":
    "この固定ページはもうありません。一覧を読み込み直しました。",
  "fixedPages.deleteFailed":
    "固定ページを削除できませんでした。もう一度試してください。",
} satisfies Translation;
