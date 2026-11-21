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
- **ファイル**:1ファイルに、1つの procedure か1つの関数を置く。export できる関数は2つまでなので、自然にこの形になる。名前は動詞から始まる kebab-case(`get-post.ts`、`decide-publish.ts`、`to-post-detail.ts`)。
- **DB に触れるファイルは `*.query.ts`**:Drizzle と DB のドライバを値として import できるのは、`*.query.ts`・`src/db/`・`src/platform/`(DB の接続を作る場所)だけにする。`src/main.ts` は Bun の API は使えるが、DB には触れない。DB を差し替えるときに直す場所が、名前で分かる。
- **Bun 専用の API は `src/platform/` と `src/main.ts` だけ**:それ以外は Web 標準で書き、実行環境を替えても直す場所を限る。
- **テーブルに書き込めるのは、持ち主の feature だけ**:読むのはどこからでもよい。トップページの集約のような、読むだけの feature が他のテーブルを join できるようにする。
- **公開状態の判定は1つの関数だけで行う**:判定を散らばらせると、どこかで漏れ、公開していないものを見せてしまう。
- **procedure は、アクセス区分を決めた base(`publicProcedures`・`authProcedures`・`deployProcedures`・`adminProcedures`)からしか作らない**:認可を付けた場所だけを守る方式では、付け忘れがそのまま漏れになる。全部の管理用の procedure が、Cookie なしで `UNAUTHORIZED` を返すことを、contract の `admin` を列挙するテストで確かめる(「入口の守り」)。
- **ビジネスイベントは変更の前と後から導く**:公開の判断をする純粋関数が、変更と一緒に出すビジネスイベントも返す。書き込みの経路ごとに出すと、経路を足すたびに、ビジネスイベントやキャッシュの無効化を出し忘れる。
- **canonical URL は server が作る**:公開サイトが日付などから URL を組み立てると、時刻帯などのずれで壊れる。
- **見つからないものと、公開していないものは区別しない**:下書きや予約中の記事も「無い」として返し、存在を漏らさない。

## エラーと依存(Effect から取り入れた考え方)

- 想定内の失敗は `_tag` 付きの判別共用体で返し、想定外の失敗は throw して入口で 500 とログにする。どの失敗かが型に出るので、扱い忘れを `switch` の網羅性の検査で見つけられる。try/catch と `.catch()` は、入口と dispatcher の外では lint で止める(入口に数える場所は `tooling/DECISIONS.md`)。
- 依存は oRPC の context で明示的に渡す。グローバルなシングルトンは、テストで差し替えられず、どこで使われているかも追えない。
- 入力は入口でデコードしてブランド型にし、内側では検証し直さない。
- リソースの後始末は `await using` で保証し、リクエストの `AbortSignal` を、DB や外部への呼び出しの渡せるところまで渡す。渡す手段の無いところは、「割り切ったこと」に書く。
- 再試行の方針はデータとして書き、環境変数は起動時に検証する。
- 汎用の合成関数やメソッドを持つ Result 型は作らない。素の TypeScript で読めることを優先する。

## HTTP の層

- **Hono を使う**:API の仕事(ルーティング、入力と出力の検証、型付きのエラー、認可の middleware)は oRPC が持つ。その外側の HTTP の仕事(セキュリティのヘッダー、CSRF の確認、リクエストの本文の大きさの上限、静的ファイル、ETag、Cookie)は、自分たちで書かずに Hono の middleware を使う。Hono は Web 標準で書かれていて Bun 以外でも動くので、「Web 標準で書く」方針に合う。Elysia は Bun 専用なので使わない。NestJS のような大きなフレームワークは、この規模には重い。
- oRPC の handler は、Hono の `/api/*` のルートとしてつなぐ。oRPC のプロトコル(`RPCHandler`)だけを出す。公開サイトも、client(oRPC の client)で公開 API を呼ぶので、contract から作る OpenAPI の handler は、今は足さない。
- middleware は `secureHeaders`・`csrf`・`bodyLimit`(`/api` は 1MB まで)。管理画面の静的ファイルの配信は、管理画面ができてから足す。内部用のポートには `bodyLimit` だけを掛ける(「2つのポート」)。
- バージョンは安定版で始める(Hono 4、oRPC 1)。Hono 5 と oRPC 2 は、まだ RC と beta。

## 2つのポート

CMS のプロセスが、外部用のポート(`PORT`、既定は 8787)と内部用のポート(`INTERNAL_PORT`、既定は 8788)の2つで待ち受ける(ユーザーと決めた)。

- 外部用のポートでは、管理用 API と認証用 API(と、後で管理画面の静的ファイル)を受ける。リクエストは、リバースプロキシを通って、ブラウザから届く。
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
- `admin` と `auth` の procedure は、GET でなければ、Origin ヘッダーが管理画面の origin(`AUTH_ORIGIN`)と完全に一致するときだけ受け付け、ほかは 403 と `FORBIDDEN` にする(Origin が無いときも)。Hono の `csrf()` はフォームの形の Content-Type だけを見て、JSON の POST はブラウザの CORS の preflight に任せている。CORS の設定や、ブラウザが preflight を送らない Content-Type に頼らないよう、Cookie で認証するアクセス区分では自分で確かめる。確かめるのは oRPC の middleware で、パスではなく contract のアクセス区分で掛ける。パーセントエンコードしたパスのような、Hono と oRPC でパスの読み方が食い違う抜け道を作らない。GET は読むだけの procedure にしか届かない(oRPC の既定で、route を GET にした procedure 以外は GET で呼べない)。同じ origin の GET に、ブラウザは Origin を付けない。代わりに、ブラウザの `Sec-Fetch-Site` が `same-origin` でないリクエストは、GET を含めて断る。同じサイトの別の origin のページに、Cookie 付きの GET を送らせないため(理由は `src/features/auth/DECISIONS.md`)。
- Hono の `csrf()` の許す origin は、リクエストの URL からではなく `AUTH_ORIGIN` から決める。TLS を終端するリバースプロキシの後ろでは、リクエストの URL の scheme やホストが、ブラウザから見た origin と食い違う。
- 外部用のポートのすべての応答に、`Permissions-Policy: publickey-credentials-create=(self), publickey-credentials-get=(self)` と、`Content-Security-Policy: frame-ancestors 'none'`・`X-Frame-Options: DENY` を付ける。ほかのサイトが管理画面を iframe に入れ、パスキーの操作を任せる(`allow` 属性)ことを、ブラウザに断らせる。Hono の `secureHeaders` には `publickey-credentials-create` の項目が無いので、Permissions-Policy は自分で書く。CSP のほかの directive は、管理画面の配信を足すときに決める。
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
- 接続先は環境変数 `DATABASE_URL` で受け、起動時に zod で検証する。migration のコマンドは `readDatabaseEnv` で `DATABASE_URL` だけを読み、server と登録用 URL のコマンドは `readEnv` で `AUTH_ORIGIN`・`AUTH_RP_ID` も読む。migration を流す場所に、認証の設定を置かなくて済む。既定値は持たない。本番で設定し忘れたときに、手元の DB を探しに行かないようにする。開発では `apps/server/.env` に書く(`.env.example` を写す)。
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
- bytea の列は、Drizzle の `bytea` ではなく `src/db/schema/bytes.ts` の型で読み書きする。Drizzle の `bytea` は Node の `Buffer` の型を持つ。feature のコードは Web 標準の `Uint8Array` で書くので、読むときに `Uint8Array` に写す。
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
- **`PORT=8788` の設定**:`PORT` に 8788 を書いていると、既定の `INTERNAL_PORT` とぶつかって起動しない(登録用 URL のコマンドも、同じ環境変数の検証を通るので止まる)。まだ本番が無く、`PORT` の既定は 8787 なので、`INTERNAL_PORT` を書けば済む。
- **止める順のテスト**:2つのポートの受け付けを同時に止めることは、テストで確かめていない。片方に時間のかかるリクエストを残したまま止める必要があり、確かめる仕組みが重い。壊れると(片方ずつ止めるようになると)、止める間に、もう片方のポートが、処理中のリクエストが終わるまで新しいリクエストを受け続ける。止める合図を受けた後の数秒に届いたリクエストが処理されるだけで、データが壊れたり漏れたりはしないので受け入れる。
- **DB に渡さない `AbortSignal`**:リクエストの `AbortSignal` は DB まで渡していない。postgres.js には問い合わせを取り消す API(`.cancel()`)があるが、Drizzle を通して渡す仕組みが無く、platform にも無いため。利用者が待つのをやめても、問い合わせは最後まで流れるだけで、結果は捨てられる。渡すときは、接続を取り置くトランザクションの rollback まで確かめる。
- **DB の接続を閉じること**:SIGTERM で止まるときに、DB の接続を閉じることはテストで確かめていない。確かめるには、子のプロセスの中の接続を、PostgreSQL の側から見張る仕組みが要る。閉じ損ねても、プロセスが終われば接続は切れ、PostgreSQL の側で片付くので、直さない。
- **消し損ねたテストの DB**:落ちたテストが消し損ねた DB と、古いテンプレートは、テスト用の PostgreSQL に残る。データは tmpfs にあるので、`docker compose restart postgres-test` で消える。テストの結果には響かないので、自動では片付けない。
- **テンプレートを作る接続だけが切れたとき**:lock を持つ接続だけが切れると、別の回が同じ作りかけを作り直しうる。そのときは両方の回が失敗するだけで、名前を変える前の照合があるので、中身の違うテンプレートが使われることはない。
