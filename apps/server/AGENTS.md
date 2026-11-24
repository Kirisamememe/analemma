# server(Analemma 本体)

理由は同じフォルダの `DECISIONS.md` にある。

## 構成

- `src/main.ts`:起動。環境変数の検証と依存の組み立て。SIGINT・SIGTERM で受け付けを止め、DB の接続を閉じて終わる。
- `src/enroll.ts`:パスキーの登録用 URL を出すコマンド(`bun run passkey:enroll`)。最初の登録と、パスキーを全部失ったときの復旧に使う。
- `src/app.ts`:HTTP の層。外部用のポート(管理用 API・認証用 API・配信用の画像・管理画面)と内部用のポート(公開 API・デプロイ用 API)の、2つの Hono のアプリを作り、それぞれの middleware に、oRPC の handler を `/api` でつなぐ。配信用の画像は、外部用のポートの `/media/` で返す。
- `src/context.ts`:context の型(起動時に組み立てる `AppContext` と、リクエストごとの `RequestContext`)。
- `src/platform/`:Bun 専用の API、DB の接続、clock、logger。
- `src/platform/images/`:写真から EXIF を読む ExifReader、写真を変換する sharp、HEIC を読む `heif-dec`、ICC の無い AVIF と cICP を持つ PNG の色を変換する FFmpeg を使う処理。どの tag を読むか、どの幅を作るかなどの決めごとは、呼ぶ feature の側に置く。
- `src/platform/dropbox/`:Dropbox のアプリとして API(認可・token・アカウント・App folder の一覧・ダウンロード)を `fetch` で呼ぶ client。context の `dropbox.api` で渡す。
- `src/platform/file-storage/`:配信用の画像のファイルを、名前で書き、読み、消す置き場所(`MEDIA_DIR` のフォルダ)。context の `storage` で渡す。
- `src/platform/startup/`:server やコマンドが起動時に使うもの。環境変数の検証(`env.ts`。DB の接続先と、管理画面の origin と RP ID を読む `parse-database-url.ts`・`parse-relying-party.ts`)、2つのポートを待ち受ける順(`choose-first-listener.ts`)、`ADMIN_DIST_DIR` に指定した管理画面のビルドの読み込みと、CSP に使う script の hash(`load-admin-dist.ts`)。
- `src/db/schema/`:全テーブルの Drizzle の定義。ログインとパスキーの表は `auth/` に分ける。drizzle-kit は `drizzle.config.ts` の glob で、下のフォルダも読む。
- `src/db/migrate.ts`:migration を適用するコマンド(`bun run db:migrate`)。server の起動とは別に流す。
- `src/db/migrations/`:drizzle-kit(`bun run db:generate`)が書き出す migration。
- `src/platform/test-database/`:テストの DB。`bun test` の前にテンプレートの DB を用意するスクリプトと、テストごとに DB を作る関数。このフォルダと `src/db/` のテストは、仕組みそのものを確かめるので DB を直接読む。
- `src/procedures.ts`:アクセス区分ごとの base(`publicProcedures`・`authProcedures`・`deployProcedures`・`adminProcedures`)。contract の `public`・`auth`・`deploy`・`admin` に対応する。
- `src/router.ts`:全 feature の procedure を束ねる。
- ビジネスイベントの型と dispatcher:まだ無い。`src/` の直下は10件で埋まっているので、置き場所は、最初のビジネスイベントを作るときに決める。
- `src/test-client/`:API 越しのテストの部品。`create-test-client.ts` が2つのポートのアプリとそれにつないだ client を、テストだけの DB と置き場所(`storage`)で作る(`await using` で受ける)。`client` は外部用のポート、`internal(token)` は内部用のポートの client。管理用 API のテストは、`passkeys/sign-in-as-admin.ts` の `signInAsAdmin` で、テスト用の認証器のパスキーを登録してログインしてから呼ぶ。種類の要るテストは、`prepare-test-kinds.ts` で種類の定義を送ってから始める。Dropbox は、HTTP の API を真似る作り物(`create-fake-dropbox.ts`。`server.dropbox`)につなぎ、`connect-test-dropbox.ts` の `connectTestDropbox` で認可を済ませる。
- `src/features/<名前>/`:feature ごとのフォルダ。複数の feature が使う概念(公開状態の判定、slug の履歴など)も feature として置く。`shared/`・`common/`・`utils/` を作らない。

## 書き方

- 1ファイルに、1つの procedure を置く。関係する小さな関数(同じテーブルの query、同じ概念の小さな純粋関数)は、コードの行数が200行以下なら、1つのファイルにまとめてよい。
- 名前は kebab-case にする。procedure と、1つの関数だけのファイルは、動詞から始める(`get-post.ts`、`decide-publish.ts`、`to-post-detail.ts`)。複数の操作をまとめた query のファイルは、テーブルか概念の名前に `.query.ts` を付ける(`session.query.ts`、`deploy-tokens.query.ts`)。小さな純粋関数をまとめたファイルも、概念の名前にする(`secret-token.ts`)。
- 用途ごとの `queries/` に `*.query.ts` を置く。procedure の中を、DB に触れる関数、判断する純粋関数、DB の行を contract の出力に変える mapper(純粋関数)に分ける。controller / service / repository の決まった層には分けない。
- feature は `src/` 内のモジュールを `@/` で import し、contract は `@analemma/contract` から import する。依存先を検査する lint は、server 内を指す相対パスも許す。Drizzle は feature の用途ごとの `queries/` にある `*.query.ts`、`bun:test` はテスト、zod は `auth/webauthn/client-data/parse-client-data.ts` で使える(lint で止める)。contract の入出力の型は、`@analemma/contract` の `ContractInputs` と `ContractOutputs` から取る。
- feature の外で Drizzle と DB のドライバを値として import できるのは `*.query.ts`・`src/db/`・`src/platform/` だけ。Bun 専用の API を使えるのは `src/platform/` と `src/main.ts` だけ。それ以外は `Request`・`Response`・`fetch` などの Web 標準で書く(どちらも lint で止まる)。
- procedure は `procedures.ts` の `publicProcedures`・`authProcedures`・`deployProcedures`・`adminProcedures` から作る。素の oRPC の builder(`implement`・`os`)は `procedures.ts` と `router.ts` だけで使う(lint で止まる)。
- テーブルに書き込めるのは、そのテーブルを持つ feature だけ。読むのはどこからでもよい。
- 公開状態の判定は、公開状態を持つ feature の関数だけで行う。見つからないものと公開していないものは区別せず、どちらも「無い」として返す。
- canonical URL は mapper で作り、公開サイトに組み立てさせない。
- ビジネスイベント(`post.published` など)の型と dispatcher を作ったら、判断する純粋関数が変更の前後からビジネスイベントを導き、トランザクションのコミットの後で `context.events` に渡す。キャッシュの無効化や Webhook には dispatcher が配る。
- テストは API 越しに書き、DB の中身を直接見ない。`src/test-client/` で組み立てたアプリに、型付きの client か `Request` で触る。判断と mapper の純粋関数には、同じフォルダの `__tests__` に単体テストを置く。
- リクエストの外で流す処理(Dropbox からの取り込み)は、入口に数え、1件ごとの想定外の失敗をログに書いて次へ進む(`tooling/DECISIONS.md`)。
- 想定内の失敗(slug の重複など)は `_tag` 付きの判別共用体で返す。想定外の失敗は throw し、入口でログにする(HTTP の入口は 500 を返し、リクエストの外で流す処理は1件ごとの進み具合に書く)。try/catch や `.catch()` で握りつぶさない(書けるのは、入口と dispatcher だけ。lint で止まる)。
- 依存(db・clock・storage・events・logger など)は oRPC の context で渡す。グローバルなシングルトンを作らない。
- 入力は入口でデコードしてブランド型にし、内側で検証し直さない。
- リソースの後始末は `await using` で保証する。リクエストの `AbortSignal` は、外部への呼び出し(`fetch` など)に渡す。DB には、今は渡す手段が無いので渡さない(`DECISIONS.md` の「割り切ったこと」の「DB に渡さない `AbortSignal`」)。
- 再試行の方針(Webhook の再送など)は設定のデータとして書く。環境変数は起動時にスキーマで検証し、不正なら起動しない。
- `pipe`・`flatMap`・`andThen` のような汎用の合成関数や、メソッドを持つ Result 型を作らない。

## セルフレビューの観点

- 公開状態の判定や認可を、決まった関数や base の外で書いていないか。
- 書き込んだ後に、ビジネスイベントを出し忘れていないか(ビジネスイベントの型と dispatcher を作った後)。
- 出力を contract のスキーマで返しているか。内部の列が出力に混ざっていないか。
- ループの中や `map` の中で DB を呼んでいないか(N+1)。

## まだ決めていないこと

- 古い slug で来たときに、新しい slug を返すか(301 で転送するため)。
- ビジネスイベントを同じプロセスのメモリで配るか、トランザクションの中でテーブルに書いてから配るか(outbox)。
- 固定ページ・画像・作品集のほかのコンテンツ(記事など)の削除を、論理削除にするか、物理削除にするか(それぞれのフェーズで決める。固定ページ・画像・作品集は物理削除に決めた)。
- server を1プロセスで動かし続けるか。challenge をプロセスのメモリに置いているので、今は1プロセスが前提(本番の置き場所と一緒に決める)。
- ログインと登録の、IP ごとの回数の制限(本番の置き場所と一緒に決める)。
- 監査の記録の残し方(今は logger に書くだけ)。
- 写真を送るときの、1回の送信の枚数と大きさの上限(今は1枚・64 MiB)と、同時に受ける枚数(今は2枚)と、変換を待つ接続を保つ時間(今は120秒)。NAS で変換の時間とメモリを測り、本番の置き場所(リバースプロキシの本文の上限とタイムアウト)と一緒に決める。
