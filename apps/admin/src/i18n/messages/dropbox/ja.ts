/** Dropbox からの取り込みの、日本語の訳。 */
export const dropboxJa = {
  "dropbox.entry": "Dropbox から取り込む",
  "dropbox.title": "Dropbox から取り込む",
  "dropbox.description":
    "Dropbox の App folder に置いた写真から、画像を作ります。取り込んだ写真は、画像の一覧の先頭に並びます。",
  "dropbox.loadFailed": "Dropbox との接続を読み込めませんでした",
  "dropbox.unconfigured":
    "server に Dropbox のアプリの設定(DROPBOX_APP_KEY・DROPBOX_APP_SECRET)がありません。設定してから server を起動し直してください。",
  "dropbox.disconnectedTitle": "Dropbox につないでいません",
  "dropbox.disconnectedDescription":
    "つなぐと、Dropbox の「アプリ」フォルダの中の、このサイトのフォルダだけを読みます。",
  "dropbox.connect": "Dropbox につなぐ",
  "dropbox.account": "つないでいるアカウント",
  "dropbox.accountDetail": "{{email}}・{{date}}につないだ",
  "dropbox.disconnect": "接続を切る",
  "dropbox.connectionFailure.NotConfigured":
    "server に Dropbox のアプリの設定が無いので、つなげません。",
  "dropbox.connectionFailure.AlreadyConnected":
    "もう Dropbox につないでいます。接続の状態を読み直しました。",
  "dropbox.connectionFailure.ImportRunning":
    "写真を取り込んでいる間は、接続を切れません。取り込みが終わってから、もう一度試してください。",
  "dropbox.connectionFailure.Failed":
    "Dropbox とやり取りできませんでした。もう一度試してください。",
  "dropbox.connectionLost":
    "Dropbox との接続が切れました。Dropbox の設定でアプリの接続を外したか、認可が取り消されています。",
  "dropbox.reconnect": "もう一度つなぐ",
  "dropbox.photosTitle": "App folder の写真",
  "dropbox.photosLoadFailed": "Dropbox の写真を読み込めませんでした",
  "dropbox.photosEmptyTitle": "App folder に写真がありません",
  "dropbox.photosEmptyDescription":
    "Dropbox の「アプリ」フォルダの中の、このサイトのフォルダに、JPEG・PNG・WebP・AVIF・HEIC の写真を置いてください。",
  "dropbox.photosSummary":
    "新しい写真 {{importable}}枚・取り込み済み {{imported}}枚",
  "dropbox.reload": "読み直す",
  "dropbox.import": "新しい写真を{{count}}枚取り込む",
  "dropbox.importNone": "新しい写真はありません",
  "dropbox.importing": "取り込んでいます",
  "dropbox.progress": "{{total}}枚のうち{{done}}枚を取り込みました",
  "dropbox.done": "{{total}}枚のうち{{added}}枚を足しました。",
  "dropbox.doneWithFailures":
    "{{total}}枚のうち{{added}}枚を足しました。{{failed}}枚は取り込めませんでした。",
  "dropbox.startFailure.NotConnected":
    "Dropbox につないでいません。先につないでください。",
  "dropbox.startFailure.ConnectionLost":
    "Dropbox との接続が切れました。もう一度つないでください。",
  "dropbox.startFailure.ImportRunning": "ほかの取り込みが進んでいます。",
  "dropbox.photoDetail": "{{size}}・{{date}}",
  "dropbox.status.new": "新しい",
  "dropbox.status.imported": "取り込み済み",
  "dropbox.status.image-deleted": "取り込み済み(画像は削除済み)",
  "dropbox.status.waiting": "待っています",
  "dropbox.status.importing": "取り込んでいます",
  "dropbox.status.added": "足した",
  "dropbox.status.already-added": "同じ写真を取り込み済み",
  "dropbox.status.not-found": "Dropbox にありません",
  "dropbox.status.changed": "選んだ後に変わりました",
  "dropbox.status.too-large": "大きすぎます({{limit}} MB まで)",
  "dropbox.status.unsupported": "対応していない形式",
  "dropbox.status.failed": "取り込めませんでした",
  "dropbox.return.NotConfigured":
    "server に Dropbox のアプリの設定が無いので、つなげませんでした。",
  "dropbox.return.AlreadyConnected": "もう Dropbox につないでいます。",
  "dropbox.return.Expired":
    "Dropbox につなげませんでした。認可の画面を開いてから時間が経ちすぎたか、別のタブで始めた認可です。",
  "dropbox.return.Rejected":
    "Dropbox が認可を断りました。取り込みの画面から、もう一度つないでください。",
  "dropbox.return.Denied": "Dropbox で許可しなかったので、つなぎませんでした。",
  "dropbox.return.Invalid":
    "この画面は、Dropbox から戻ったときに開きます。取り込みの画面から、つなぎ始めてください。",
  "dropbox.return.Failed":
    "Dropbox につなげませんでした。時間を置いて、もう一度試してください。",
  "dropbox.returnReady":
    "Dropbox で許可しました。つなぐと、取り込みの画面に戻ります。",
  "dropbox.returnConnect": "つなぐ",
  "dropbox.returnBack": "取り込みの画面に戻る",
} as const;
