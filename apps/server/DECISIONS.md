# 決めたことと理由(server)

## 書き方

feature ごとにフォルダを分け、中を controller / service / repository の決まった層には分けない。DB に触れる関数、判断する純粋関数、DB の行を contract の出力に変える mapper を分け、それらを順に呼ぶのが procedure の実装になる。

- 一般的な設計では service が担う仕事(順に呼ぶ、判断する、形を変える)を、役割ごとに分ける。判断と形の変換を純粋関数にすると、DB のモックなしで単体テストできる。
- 素通しするだけの層を作らない。
- feature で切ることは、珍しくない(NestJS の module、Rails や Django の app、Vertical Slice Architecture)。feature で切ったうえで、その中を三層にする作りも多い。ここで違うのは、feature の中の分け方だけ。

## 構成

公開サイトが記事を取得する、管理画面で公開する、記事を削除する、トップページの集約、管理画面へのログイン、の5つの場面で考えて決めた。

- **フォルダ**:`src/main.ts`(起動)、`src/platform/`(Bun 専用の API、DB の接続、clock、logger)、`src/db/schema/`(全テーブルの定義)、`src/procedures.ts`(アクセス区分ごとの base)、`src/enroll.ts`(登録用 URL を出すコマンド)、`src/router.ts`、`src/features/<名前>/`。ビジネスイベントの型と dispatcher は、まだ無い。`src/` の直下は10件で埋まっているので、置き場所は作るときに決める。
- **共通の概念も feature にする**:公開状態の判定や slug の履歴のように、複数のコンテンツの型が使う概念も `features/` に置く。`shared/`・`common/` のような置き場を作ると、何でも入る場所になる。
- **ファイル**:1ファイルに、1つの procedure を置く。関係する小さな関数(同じテーブルの query、同じ概念の小さな純粋関数)は、コードの行数が200行以下なら、1つのファイルにまとめてよい(ユーザーの依頼で、エージェントが決めた)。関数ごとにファイルを分けると、小さなファイルで feature のフォルダの10件がすぐに埋まる。200行は、export できる関数の数を問わない境目(`tooling/DECISIONS.md` の `max-exported-functions`)と同じ。名前は、procedure と1つの関数だけのファイルは動詞から始まる kebab-case(`get-post.ts`、`decide-publish.ts`、`to-post-detail.ts`)、まとめたファイルはテーブルか概念の名前(`session.query.ts`、`secret-token.ts`)にする。
- **DB に触れるファイルは用途ごとの `queries/` に置く**:同じ用途の procedure や判断に近い場所に置き、DB を操作するファイルを見つけやすくする(ユーザーが決めた)。feature の外で Drizzle と DB のドライバを値として import できるのは、`*.query.ts`・`src/db/`・`src/platform/`(DB の接続を作る場所)だけにする。`src/main.ts` は Bun の API は使えるが、DB には触れない。DB を差し替えるときに直す場所が、名前で分かる。
- **server とコマンドの起動**:環境変数の検証・待ち受ける順・管理画面のビルドの読み込みを `src/platform/startup/` にまとめる。環境変数の検証は、migration と登録用 URL のコマンドも起動時に使う。DB の接続・clock・logger はリクエストの処理でも使うので、platform の直下に置く。
- **Bun 専用の API は `src/platform/` と `src/main.ts` だけ**:それ以外は Web 標準で書き、実行環境を替えても直す場所を限る。
- **feature の外部依存**:procedure と mapper は `@analemma/contract` から入出力の型を取る。contract の定義から推論した型を使うと、API の形が変わったときに型検査でわかる。HTTP のライブラリは、リクエストを受けるコードと `src/platform/` に集める。Drizzle は feature の用途ごとの `queries/` にある `*.query.ts` で直接使う。テーブル定義からの型推論を保ったまま DB の読み書きを1つのファイルで読めるようにするため。
- **テーブルに書き込めるのは、持ち主の feature だけ**:読むのはどこからでもよい。トップページの集約のような、読むだけの feature が他のテーブルを join できるようにする。
- **公開状態の判定は1つの関数だけで行う**:判定を散らばらせると、どこかで漏れ、公開していないものを見せてしまう。
- **procedure は、アクセス区分を決めた base(`publicProcedures`・`authProcedures`・`deployProcedures`・`adminProcedures`)からしか作らない**:認可を付けた場所だけを守る方式では、付け忘れがそのまま漏れになる。全部の管理用の procedure が、Cookie なしで `UNAUTHORIZED` を返すことを、contract の `admin` を列挙するテストで確かめる(「入口の守り」)。
- **ビジネスイベントは変更の前と後から導く**:公開の判断をする純粋関数が、変更と一緒に出すビジネスイベントも返す。書き込みの経路ごとに出すと、経路を足すたびに、ビジネスイベントやキャッシュの無効化を出し忘れる。
- **canonical URL は server が作る**:公開サイトが日付などから URL を組み立てると、時刻帯などのずれで壊れる。
- **見つからないものと、公開していないものは区別しない**:下書きや予約中の記事も「無い」として返し、存在を漏らさない。

## import の別名と入口

- server の `src/` の中を指すモジュールは、`tsconfig.json` の `paths` に置いた `@/` で import する。ファイルを別のフォルダへ移しても、そのファイルが参照する先への `../` の段数を直さずに済む。Bun と TypeScript は同じ設定を読む。
- ルーターが同じ feature から複数の procedure を登録するときは、その procedure を `index.ts` で明示的に export する。ルーターを読むと、どの feature が API を実装するかが分かる。procedure を組み立てる `procedures.ts` は、認可で使うセッションとデプロイ用のトークンのファイルを直接読む。feature の中や、ほかの feature の query と純粋関数を使うときも、実装を持つファイルを指定する。
- API 越しのテストが使う `test-client/` の部品は `@/test-client` にまとめる。テストを読むと、どこからアプリの組み立てと操作を持ってくるかが分かる。`test-client/` の中では、部品を持つファイルを直接読む。

## エラーと依存(Effect から取り入れた考え方)

- 想定内の失敗は `_tag` 付きの判別共用体で返し、想定外の失敗は throw して入口で 500 とログにする。どの失敗かが型に出るので、扱い忘れを `switch` の網羅性の検査で見つけられる。try/catch と `.catch()` は、入口と dispatcher の外では lint で止める(入口に数える場所は `tooling/DECISIONS.md`)。
- 依存は oRPC の context で明示的に渡す。グローバルなシングルトンは、テストで差し替えられず、どこで使われているかも追えない。
- 入力は入口でデコードしてブランド型にし、内側では検証し直さない。
- リソースの後始末は `await using` で保証し、リクエストの `AbortSignal` を、DB や外部への呼び出しの渡せるところまで渡す。渡す手段の無いところは、「割り切ったこと」に書く。
- 再試行の方針はデータとして書き、環境変数は起動時に検証する。
- 汎用の合成関数やメソッドを持つ Result 型は作らない。素の TypeScript で読めることを優先する。

## HTTP の層

- **Hono を使う**:API の仕事(ルーティング、入力と出力の検証、型付きのエラー、認可の middleware)は oRPC が持つ。その外側の HTTP のルーティングは Hono が受け持ち、セキュリティのヘッダー、CSRF の確認、リクエストの本文の大きさの上限には Hono の middleware を使う。Hono は Web 標準で書かれていて Bun 以外でも動くので、「Web 標準で書く」方針に合う。Elysia は Bun 専用なので使わない。NestJS のような大きなフレームワークは、この規模には重い。
- oRPC の handler は、Hono の `/api/*` のルートとしてつなぐ。oRPC のプロトコル(`RPCHandler`)だけを出す。公開サイトも、client(oRPC の client)で公開 API を呼ぶので、contract から作る OpenAPI の handler は、今は足さない。
- 外部用のポートでは、静的ファイルを含むすべての応答に `secureHeaders` を掛ける。API には `csrf` と `bodyLimit`(1 MB)も掛ける。写真を送る procedure だけは、ログイン中なら上限を大きくする(`src/features/images/DECISIONS.md` の「直接アップロード」)。内部用のポートの middleware は `bodyLimit` だけとする。
- `ADMIN_DIST_DIR` に管理画面のビルドの出力先を指定する。相対パスの起点は server プロセスの cwd。未設定なら、server は管理画面を配信しない(開発では Vite の開発のサーバーが配る)。設定したときは起動時にファイルを読み込み、フォルダや `index.html` が読めなければ、ポートを開く前に止まる。
- 配信するのは、起動時に読んだ通常のファイルだけ。ドットで始まる名前とシンボリックリンクを除く。管理画面のビルドがメモリに収まるので、リクエストのパスでファイルシステムを開く必要がなく、HTML と CSP も同じビルドのものになる。ビルドを入れ替えたら server を再起動する。
- `/api` と `/api/` 以下は oRPC に渡し、`/media/` 以下は配信用の画像の経路に渡す(次の項目)。それ以外は GET・HEAD で静的ファイルを返し、ほかのメソッドには 405 を返す。ファイルに当たらない画面の URL には SPA の入口の `index.html` を返す。`/assets/` 以下の欠落は 404 にし、JS や CSS のリクエストに HTML が返るのを防ぐ。
- `/media/` 以下は、配信用の画像を返す経路にする(`src/features/images/DECISIONS.md` の「配信」)。管理画面を配る設定でも、静的ファイルより先に受け、形の違う path も `index.html` にせずに 404 を返す。GET・HEAD のほかは 405。管理画面に画像の画面を作るときの route(`/images`)とぶつけないため、`/images/` にしない。
- `/media/` 以下の応答だけは、`Cross-Origin-Resource-Policy` を `cross-origin` にする。公開サイト(別の origin)のページが、公開の画像を `<img>` で読めるようにするため。`secureHeaders` は既定で `same-origin` を付け、handler が付けた値を上書きするので、`secureHeaders` より先に登録した middleware で、後から付け直す。非公開の画像は、Cookie と `Sec-Fetch-Site` で守り、別の origin からのリクエストには 404 を返す。
- `index.html` は、ビルドを入れ替えると新しいファイルを指し、応答ごとに nonce も変わるので `no-store` とする。Vite がファイル名に hash を含める `/assets/` は `public, max-age=31536000, immutable`、同じ名前のまま差し替わる favicon などは毎回確かめるよう `no-cache` とする。
- バージョンは安定版で始める(Hono 4、oRPC 1)。Hono 5 と oRPC 2 は、まだ RC と beta。

## 配信用の画像の置き場所

- 配信用の画像のファイルは、環境変数 `MEDIA_DIR` のフォルダに置く(ユーザーと決めた。本番の環境と一緒に見直す)。相対パスの起点は server プロセスの cwd。server は起動時にフォルダを開き、無いかフォルダでなければ、ポートを開く前に止まる。名前を書き誤ったフォルダに、黙ってファイルを書き始めないため。
- `MEDIA_DIR` は、server だけが `readServerEnv` で読む。登録用 URL のコマンドは `readEnv` で読み、`MEDIA_DIR` を求めない。
- ファイルを書き、読み、消す処理は `src/platform/file-storage/` に置く。画像の feature(直接アップロードと配信)と、Dropbox からの取り込み(別の feature にする)が使い、実行環境を替えたときに直す場所だから。feature の lint に、ファイルシステムを使う例外は作らない。
- ファイルは、置き場所の中の名前(`a/b.avif` の形。小文字・数字・`-`・`_` の部分を `/` でつなぎ、拡張子を付ける)で指す。ほかの形の名前は、読む・書く・消すのどれでも、ファイルに触れずに throw する。`..` や絶対パスで、置き場所の外のファイルに届かないようにするため。名前は server が作るので、合わない名前は想定外の失敗にする。
- 書くときは、一時ファイルを経ずに、その名前のファイルに直接書く。書く途中で止まると、途中までのファイルが残る。配信用の画像の行はすべてのファイルを書き終えてから確定するため、書きかけのファイルを指す行はできない。登録と失敗時の後始末は画像の `DECISIONS.md` の「写真の登録」にある。
- テストは、`createTestClient` ごとに一時的なフォルダを作り、抜けると消す。

## 2つのポート

CMS のプロセスが、外部用のポート(`PORT`、既定は 8787)と内部用のポート(`INTERNAL_PORT`、既定は 8788)の2つで待ち受ける(ユーザーと決めた)。

- 外部用のポートでは、管理用 API と認証用 API を受け、配信用の画像を返し、設定に応じて管理画面の静的ファイルを配信する。リクエストは、リバースプロキシを通って、ブラウザから届く。
- 内部用のポートでは、公開 API とデプロイ用 API を受ける。同じサーバーで動く公開サイト(Amayadori)のサーバーと、デプロイのときの CLI だけが呼ぶ。サーバーの外からは届かない。`INTERNAL_HOST`(既定は 127.0.0.1)で、待ち受けるアドレスを決める。公開サイトを別のコンテナで動かすときは、コンテナの内部のネットワークのアドレスにし、ホストのポートに結び付けない(Compose の `ports:` に書かない)。
- リバースプロキシのパスの設定で分けない。設定を一つ誤ると、公開 API やデプロイ用 API が外から届く。待ち受けるポートで分ければ、外から届かないようにする約束は「内部用のポートで、サーバーの外から届く場所を待ち受けない」だけになる。
- 公開 API をサーバーの外から届かないようにすることは、ユーザーと決めた。読む API が外から届かない方が安全で、サーバーの処理を CMS と同じサーバーで動かすサイトしか、公開 API を使えないことは受け入れた。
- どちらのポートで、どの procedure を受けるかは、contract のアクセス区分で決める(`app.ts` の `externalRouter`・`internalRouter`)。外部用のポートに公開 API とデプロイ用 API が無いこと、内部用のポートに管理用 API と認証用 API が無いことを、contract を列挙するテスト(`src/__tests__/app.test.ts`)で確かめる。
- 内部用のポートには、ブラウザに向けた守り(`secureHeaders`・`csrf()`・Origin の確認)を掛けない。ブラウザから呼ぶものではなく、Cookie も使わない。本文の大きさの上限と、受けるメソッドの制限は、外部用のポートと同じに掛ける。
- health(`public.health.get`)は公開 API なので、内部用のポートにだけ置く。コンテナの healthcheck は、同じマシンの中から呼ぶ。
- `PORT` と `INTERNAL_PORT` が同じ番号なら、起動の時点で断る(どちらも `0` のときを除く)。`INTERNAL_PORT` も、`0` なら OS が空いているポートを選び、起動のログに実際のポートを書く。
- 番号を決めたポートで、OS に選ばせる(`0` の)ポートより先に待ち受ける(どちらも決めたか、どちらも `0` なら内部用のポートが先)。OS が選ぶ番号が、もう片方に決めた番号を先に取ってしまわないように(Codex と Copilot のレビューで見つかった)。
- 止めるときは、2つのポートの受け付けを同時に止めてから、処理中のリクエストが終わるのを待つ。片方の処理中のリクエストを待つ間に、もう片方が新しいリクエストを受けないように(Codex のレビューで見つかった)。

## contract の分け方

contract を4つのアクセス区分に分け、server ではそれぞれの base から実装する。

- `public`(公開 API):内部用のポートで受け、資格情報を求めない。公開サイトのサーバーからだけ呼ぶので、CORS も要らない。公開サイト向けの client には、`public` と `deploy` だけを含める。
- `deploy`(デプロイ用 API):内部用のポートで受け、デプロイ用のトークンを求める。公開サイトのデプロイのときに、client の CLI が種類の定義を送る(`src/features/deploy-tokens/DECISIONS.md`)。
- `auth`(認証用 API):セッション無しで呼ぶ、ログインと登録用 URL からの登録。ログインの前に呼ぶので `admin` には置けないが、公開サイトには要らないので `public` にも置かない。`authProcedures` から作る。
- `admin`(管理用 API):ログイン中の管理者だけ。

認可は `admin` の全体にかかる middleware 1つで行い、oRPC はこの middleware を入力の検証より先に走らせる。contract の `admin` を列挙するテスト(`features/auth/__tests__/admin-access.test.ts`)が、管理用の procedure がすべて、Cookie なしで 401 と `UNAUTHORIZED` を返すことを確かめる。同じテストが、`admin` と `auth` の procedure がすべて、Origin が違えば 403 と `FORBIDDEN` を返すことと、応答をキャッシュさせないことを確かめる。

## 入口の守り(Codex のレビューを受けて足した)

- `/api` が受けるのは GET と POST だけ。ほかのメソッドは procedure に渡さずに 405 を返す。Hono は HEAD を GET のルートに回すが、oRPC には HEAD のまま届き、oRPC の既定の検査は GET しか見ない。そのままだと、HEAD や OPTIONS で更新の procedure が動く。
- 管理用の応答と認証用の応答とデプロイ用の応答には、断ったときも含めて `Cache-Control: no-store` を付ける。認証用の procedure は、ログインのたびに Set-Cookie を返すため。`csrf()` や本文の大きさの上限が procedure の前で断る応答(403・413)にも付くよう、no-store の middleware を、それらより先に置く。Cookie で認可していても、途中のキャッシュに保存されると、後のリクエストが認可を通らずに中身を受け取れてしまう。公開 API の応答のキャッシュは、キャッシュの設計と一緒に決める。
- `admin` と `auth` の procedure は、GET でなければ、Origin ヘッダーが管理画面の origin(`AUTH_ORIGIN`)と完全に一致するときだけ受け付け、ほかは 403 と `FORBIDDEN` にする(Origin が無いときも)。Hono の `csrf()` はフォームの形の Content-Type だけを見て、JSON の POST はブラウザの CORS の preflight に任せている。CORS の設定や、ブラウザが preflight を送らない Content-Type に頼らないよう、Cookie で認証するアクセス区分では自分で確かめる。確かめるのは oRPC の middleware で、パスではなく contract のアクセス区分で掛ける。パーセントエンコードしたパスのような、Hono と oRPC でパスの読み方が食い違う抜け道を作らない。GET は読むだけの procedure にしか届かない(oRPC の既定で、route を GET にした procedure 以外は GET で呼べない)。同じ origin の GET に、ブラウザは Origin を付けない。代わりに、`Sec-Fetch-Site` が `same-origin` でないリクエストは、GET を含めて断る(`Sec-Fetch-Site` が無いときも。対応するブラウザはどれも付ける)。同じサイトの別の origin のページに、Cookie 付きの GET を送らせないため(理由は `src/features/auth/DECISIONS.md`)。
- Hono の `csrf()` の許す origin は、リクエストの URL からではなく `AUTH_ORIGIN` から決める。TLS を終端するリバースプロキシの後ろでは、リクエストの URL の scheme やホストが、ブラウザから見た origin と食い違う。
- 外部用のポートのすべての応答に、`Permissions-Policy: publickey-credentials-create=(self), publickey-credentials-get=(self)` と `X-Frame-Options: DENY` を付け、CSP に `frame-ancestors 'none'` を含める。ほかのサイトが管理画面を iframe に入れ、パスキーの操作を任せる(`allow` 属性)ことを、ブラウザに断らせる。Hono の `secureHeaders` には `publickey-credentials-create` の項目が無いので、Permissions-Policy は自分で書く。静的ファイルは Cookie を使わないので、別のサイトのリンクやブックマークからも開ける。Origin と `Sec-Fetch-Site` の確認は管理用 API と認証用 API に掛ける。
- 管理画面を配るときは、外部用のポートの API にも、静的ファイルと同じ次の CSP を付ける。API はリソースを読み込む文書を返さないため、応答ごとにポリシーを切り替える必要がない。`default-src`・`base-uri`・`form-action`・`frame-ancestors`・`object-src` は `'none'`。画像と API への接続は同じ origin に限る。ビルドは外部のフォント、manifest、data URL の画像を読まない。
- `script-src` は同じ origin の JS と、起動時に `index.html` の src の無い script の本文から Web Crypto で求めた SHA-256 の hash を許す。ビルド時に hash を別ファイルに書く方法では、配信する HTML とそのファイルをそろえる必要がある。Zod は `Function` が使えない環境でも検証できるので、`unsafe-eval` は許さない。
- `style-src` は同じ origin の CSS と、応答ごとの nonce を許す。React Aria は、press の操作の間と、スクロールを止めるときに、style 要素を head に足し、`<meta name="csp-nonce">` の値を nonce として付ける。server は、`index.html` を返すたびに Hono の `secureHeaders` の `NONCE` で nonce を作り、`<head>` の直後にその meta を差し込む。style 要素の本文の hash を書く方法では、React Aria を上げて本文が変わると、黙って style が効かなくなる。
- 認可の middleware は、`adminProcedures` に付けるのに加えて、`router.ts` で管理用のルーター全体にも掛ける(oRPC は同じ middleware の重複を1つにまとめる)。管理用の procedure を `adminProcedures` 以外から作る抜け道ができても、認可が外れない。
- 認可のテストは、server のルーターではなく contract の `admin` を列挙する。ルーターに遅延読み込みの枝が入っても、contract にある procedure は必ず検査される。
- 想定外の失敗のログは、procedure を呼ぶ段階(`clientInterceptors`)で取る。リクエストを読む段階で取ると、壊れた JSON のような利用者の誤りまで、server の障害として記録されてしまう。
- ログには、Error の名前・メッセージ・スタックと、Error である cause だけを書く。Error でない cause には Cookie などの任意の値が入りうるので書かない。BigInt や循環する値があってもログが消えないようにする。

## セッション

パスキーとセッションの判断は、`src/features/auth/DECISIONS.md` にある。

- `procedures.ts` の認可の middleware が、Cookie の token でセッションを続け(`resumeSession`)、context の `session` に入れる。期限を延ばしたら、応答で Cookie を書き直す。
- 応答のヘッダーは、context の `resHeaders` に書く。oRPC の `ResponseHeadersPlugin` が、失敗した応答にも足す。確かめられなかった Cookie を、401 の応答で消させるため。

## DB の接続

- postgres.js の接続を開いて Drizzle で包むのは `src/platform/database.ts` だけにする。`main.ts` が起動時に1つ開き、context の `db` で渡す。
- 接続先は環境変数 `DATABASE_URL` で受け、起動時に zod で検証する。migration のコマンドは `readDatabaseEnv` で `DATABASE_URL` だけを読み、登録用 URL のコマンドは `readEnv` で `AUTH_ORIGIN`・`AUTH_RP_ID` も読み、server は `readServerEnv` でさらに `MEDIA_DIR` も読む。migration を流す場所に、認証の設定を置かなくて済む。既定値は持たない。本番で設定し忘れたときに、手元の DB を探しに行かないようにする。開発では `apps/server/.env` に書く(`.env.example` を写す)。
- `DATABASE_URL` は、起動時に1回だけ URL として読み、ホスト・ポート・DB の名前・ロール・パスワードに分ける。分けた値を、postgres.js に option で1つずつ渡す。URL のまま渡すと、postgres.js は `?host=`・`?port=` を URL の本体より優先し、省かれた部分を `PGHOST`・`PGPORT`・`PGPASSWORD` などの環境変数で埋める。検証した接続先と、実際につなぐ先が食い違いうる(`?host=` で別の DB に migration が適用されるのを実測した)。
  - ホスト・DB の名前・ロール・パスワードは必ず書かせる。ポートを省いたら 5432 にし、`PGPORT` は見ない。ポートの `0` は拒む(postgres.js は `0` を「指定なし」と見なし、`PGPORT` を使う)。
  - `PG` で始まる環境変数があっても、渡した接続先だけが postgres.js に届くことをテストで確かめる。
  - `?` の後ろ(クエリ引数)と `#` の後ろは受け付けない。接続先を変えるものがあるうえ、黙って捨てると、書いた人の意図(`sslmode` など)と違う接続になる。要るものが出てきたら、決めてから足す。
  - 読めないときは、変数の名前と決まった文言だけを出して止まる。URL をそのまま出すと、パスワードがログに残る。
- server のポートは環境変数 `PORT` で受ける。0〜65535 の数だけを受け付け、空の値は拒む(空を 0 と読むと、黙って OS にポートを選ばせてしまう)。`0` を渡すと OS が空いているポートを選び、起動のログに実際のポートを書く。テストはこれを使う。
- `main.ts` は、SIGINT・SIGTERM を受けたら、HTTP の受け付けを止め(処理中のリクエストは終わるまで待つ)、DB の接続を閉じて終わる。後始末は `AsyncDisposableStack` に積み、積んだのと逆の順で片付ける。テストで確かめているのは、SIGTERM で止まることまで(「割り切ったこと」)。
- PostgreSQL からの通知(NOTICE)は logger に書く。postgres.js は既定で console に出す。

## migration

- `bun run db:migrate`(`src/db/migrate.ts`)で適用する。server の起動とは別のコマンドにし、デプロイごとに1回だけ流す。
- Drizzle の `migrate()` は advisory lock を取らない(issue #874)ので、`migrateDatabase` が自分で取る。同じ DB に同時に流しても、1つずつ適用される。
  - 1つのトランザクションの中で、`pg_advisory_xact_lock` を取り、superuser の確認、適用済みの migration との照合、適用をまとめて流す。Drizzle の適用は、その中の savepoint になる。lock を持つ接続と適用する接続が同じなので、接続が切れたら適用ごと rollback され、lock だけが外れて別の適用が並んで進むことがない。
  - migration のフォルダは1回だけ読み、照合と適用に同じ中身を使う。読み込んだ一覧を受け取る Drizzle の `migrate`(`drizzle-orm/pg-core/async/session`)を使う。パッケージが export している入口(`./*` の exports)だが、バージョンを上げるときは、引数の形が変わっていないか確かめる。
- superuser でないロールで流す。superuser でつないだら、何も変えずに断る。migration に superuser の要るもの(trusted でない拡張など)が入ったら、テストのテンプレートを作る段階で失敗して気づける。
- 適用済みの migration は、書き換えず、消さず、名前も変えない。直したいときは、新しい migration を足す。Drizzle は名前だけを見て適用済みのものを飛ばすので、書き換えても黙って成功し、名前を変えると新しい migration として適用し直してしまう。`migrateDatabase` は、適用済みのものと同じ名前で SQL の hash が違う migration か、フォルダから消えた migration があれば、何も適用せずに失敗する。
- `migrate()` は、migration が空でも、`drizzle` という PostgreSQL のスキーマと `__drizzle_migrations` テーブルを作る。DB への CREATE 権限が要るので、ロールは DB の持ち主にする。開発とテストでは、server も同じロールでつなぐ。本番で実行用のロールを DML だけに絞るかは、本番の置き場所と一緒に決める。
- migration は drizzle-kit(`bun run db:generate`)で `src/db/migrations/` に書き出す。Drizzle の `migrate()` は、フォルダが無いと失敗する。
- テーブル定義を変えて migration を生成し忘れると、テストの DB にも本番にも新しい形が入らない。`src/db/__tests__/schema-drift.test.ts` が、migration のフォルダを一時的なフォルダに写して `drizzle-kit generate` を流し、差分が出ないこと(新しい migration が書かれないこと)を確かめる。リポジトリの migration のフォルダには書かない。drizzle-kit の設定は `drizzle.config.ts` を読み込んで `out` だけを差し替え、設定を写さない。
- bytea の列は、Drizzle の `bytea` ではなく `src/db/bytes.ts` の型で読み書きする。Drizzle の `bytea` は Node の `Buffer` の型を持つ。feature のコードは Web 標準の `Uint8Array` で書くので、読むときに `Uint8Array` に写す。
- `src/db/migrations/` は生成物なので、フォルダの名前と数の検査と、oxfmt の整形から外している(理由は `tooling/DECISIONS.md` の「フォルダの整理」)。このフォルダは、`drizzle.config.ts` の `out`・`MIGRATIONS_FOLDER`・structure の検査の除外・`.oxfmtrc.json` の4か所に書くので、そろっていることをテストで確かめる。

## テストの DB

- `bun run test` は、`bun test` の前に `test:prepare`(`src/platform/test-database/prepare.ts`)を流す。テスト用の PostgreSQL を起動し、migration を適用したテンプレートの DB を作る。preload で作らないのは、`bun test --parallel` では preload の `beforeAll` がファイルごとに走るため。
- Docker Compose で起動できなかったら、間を置いて3回までやり直す(コンテナがまだ無いときに複数の worktree から同時に起動すると、1つ以外が失敗するため)。3回とも失敗したら、最後の出力と文言を出して止まる。
- `createTestClient()` は、呼ぶたびにテンプレートから DB を作り、`await using` で抜けると消す。テストごとに DB が分かれるので、`--parallel` でもぶつからない。テストごとにトランザクションを rollback する方式は、アプリにトランザクションを注入する必要があり、API 越しのテストに向かない。
- DB を作ったり消したりするのは superuser で、アプリは superuser でないロールでつなぐ。superuser の接続は、DB を作るときと消すときだけ開く。テストの DB へのプールは2本までにする(`--parallel` や `--concurrent` を重ねたときに、`max_connections` を超えないように)。
- テンプレートの名前は、migration の名前と SQL の hash と、drizzle-orm のバージョンから決める。worktree ごとに migration が違っても、同じテスト用の PostgreSQL を使える。migration か drizzle-orm を変えると名前が変わるので、古いテンプレートを使い続けることもない。テンプレートが無ければ、テストは `bun run test` で作るよう伝えて失敗する。
- 複数の worktree で同時に check を流しても(Stop hook)、advisory lock で1つだけがテンプレートを作る。advisory lock は接続(セッション)に付くので、lock を取ってから名前を変えるまで、`reserve()` で取り置いた同じ接続を使う。プールに任せると、途中で接続が切れたときに、lock を持たない新しい接続で続きを流してしまう。
- 作りかけは `_building` の付いた名前で、`template0` から作り、migration を適用してから名前を変える。migration が失敗したら、lock を持っているあいだに、その回の作りかけを消す。前の回が落ちて残った作りかけは、次に作るときに消す。
- 名前を変える前に、実際に適用した migration(`__drizzle_migrations` の名前と hash)が、名前を決めるときに読んだ migration と一致するかを照らし合わせる。読んでから適用するまでに migration のファイルが書き換えられると、名前と中身が食い違ったテンプレートができ、別の worktree が使ってしまうため。
- テンプレートは `ALLOW_CONNECTIONS false` にする。テンプレートに誰かがつないでいると、そこから DB を作れない(約5秒待ってから失敗する)。テンプレートを使わない空の DB は、`template1` ではなく `template0` から作る。`template1` には GUI のクライアントなどがつないでいることがある。
- テンプレートから複製されるのは、DB の中身(PostgreSQL のスキーマ・テーブル・関数など)だけ。DB 単位の設定と権限(`ALTER DATABASE … SET`、`GRANT … ON DATABASE`)は複製されない。migration でこれらを使うと、テストの DB には入らない。
- 接続先はテスト用の Compose で決まっているので、環境変数ではなく定数で持つ(`to-test-database-target.ts`)。
- テストから起動する子のプロセスは、すべて `--no-env-file` を付ける。Bun は cwd の `.env` を自動で読むので、`apps/server` で `bun test` を流すと、子が `.env` の DB(開発用)につないでしまう。
- テストの DB の仕組みと migration のコマンドのテストは、仕組みそのものを確かめるので、DB を直接読む。feature のテストは、これまでどおり API 越しに書く。
- テンプレートを用意する関数と `migrateDatabase` は、migration のフォルダを受け取れる。テストでは、一時的なフォルダに書いた migration(`write-test-migrations.ts`)で、SQL が複製先の DB に入ること、失敗したらテンプレートを作らないことなどを確かめる。feature のテーブルをリポジトリに足さずに済む。

## 割り切ったこと

- **`INTERNAL_HOST` のワイルドカード**:`INTERNAL_HOST` に `0.0.0.0` や `::` を渡すと、内部用のポートがすべてのインターフェースで待ち受ける。公開サイトを別のコンテナで動かすときは、コンテナの中で `0.0.0.0` にし、ホストのポートに結び付けないのが普通なので、断らない。ホストで直に動かすときに、外から届かないようにするのは、置き方を決める人の責任にする。
- **`INTERNAL_HOST` に付けたポート**:`127.0.0.1:8788` のようにポートを付けても、環境変数の検証は通る(IPv6 のアドレスと見分けにくい)。`Bun.serve` が起動の時点で失敗するので、黙って違う場所で待ち受けることは無い。
- **止める順のテスト**:2つのポートの受け付けを同時に止めることは、テストで確かめていない。片方に時間のかかるリクエストを残したまま止める必要があり、確かめる仕組みが重い。壊れると(片方ずつ止めるようになると)、止める間に、もう片方のポートが、処理中のリクエストが終わるまで新しいリクエストを受け続ける。止める合図を受けた後の数秒に届いたリクエストが処理されるだけで、データが壊れたり漏れたりはしないので受け入れる。
- **DB に渡さない `AbortSignal`**:リクエストの `AbortSignal` は DB まで渡していない。postgres.js には問い合わせを取り消す API(`.cancel()`)があるが、Drizzle を通して渡す仕組みが無く、platform にも無いため。利用者が待つのをやめても、問い合わせは最後まで流れるだけで、結果は捨てられる。渡すときは、接続を取り置くトランザクションの rollback まで確かめる。
- **DB の接続を閉じること**:SIGTERM で止まるときに、DB の接続を閉じることはテストで確かめていない。確かめるには、子のプロセスの中の接続を、PostgreSQL の側から見張る仕組みが要る。閉じ損ねても、プロセスが終われば接続は切れ、PostgreSQL の側で片付くので、直さない。
- **消し損ねたテストの DB**:落ちたテストが消し損ねた DB と、古いテンプレートは、テスト用の PostgreSQL に残る。データは tmpfs にあるので、`docker compose restart postgres-test` で消える。テストの結果には響かないので、自動では片付けない。
- **テンプレートを作る接続だけが切れたとき**:lock を持つ接続だけが切れると、別の回が同じ作りかけを作り直しうる。そのときは両方の回が失敗するだけで、名前を変える前の照合があるので、中身の違うテンプレートが使われることはない。
