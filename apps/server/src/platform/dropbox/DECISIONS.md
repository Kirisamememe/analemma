# 決めたことと理由(Dropbox の API の client)

Dropbox のアプリとして API を呼ぶ処理を置く。どの写真を取り込むかなどの決めごとは、呼ぶ feature(`src/features/dropbox/`)の側に置く。

## 呼び方

- 公式の SDK(`dropbox`)を使わず、使う endpoint(認可・token の交換と更新・取り消し・アカウント・一覧・ダウンロード)を `fetch` で呼ぶ。SDK は 2022 年から 2026 年 7 月まで手入れが止まっていた。今も、OAuth の URL を encode せずに組み立て、app secret を query に置く。数本の endpoint のために、その依存を持たない。
- 応答は zod で確かめる。使う項目だけを見て、知らない項目は捨てる(Dropbox は項目を足していく)。
- app secret は HTTP Basic で送り、URL にも本文にも書かない。途中のログに残さないため。
- 失敗は、次の3つに分ける。token が使えない(API の 401)は `Unauthorized`、code か refresh token を Dropbox が断ったものは `Rejected`・`Revoked`、ほかは想定外の失敗として throw する。
  - code は、token の endpoint の 400 の `invalid_grant`(期限切れ・使った code・違う redirect URI)だけを `Rejected` にする。app secret の誤りのような設定の誤りは、500 とログで知らせる。
  - 取り消し(`auth/token/revoke`)は、200 と、取り消し済みの 401 を成功にし、ほかは throw する。Dropbox で取り消せていないまま、取り消せたことにしないため。
  - refresh token は、429 を除く 4xx をすべて `Revoked` にする。利用者がアプリを切ったとき(`invalid_grant`)のほか、app secret を作り直したときも、再接続で戻せるようにするため。5xx と 429 は、待てば戻るので throw する。

## テスト

- HTTP の API を真似る作り物の Dropbox(`src/test-client/create-fake-dropbox.ts`)に、client の `fetch` を差し替えてつなぐ。本物のアプリの登録は利用者がするので、テストは Dropbox に届かない。

## 割り切ったこと

- **token の endpoint の失敗の形**:token の endpoint が code を断るときの本文(400 の `{"error":"invalid_grant"}`)は、Dropbox の文書に無く、公式の Python SDK の扱いに合わせた。形が変わると、期限の切れた code が `AUTHORIZATION_REJECTED` ではなく 500 になる。つなぎ直せば済み、データも壊れないので、ほかの形まで推し量って受けることはしない。
