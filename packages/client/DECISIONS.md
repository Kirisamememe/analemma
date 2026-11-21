# 決めたことと理由(client)

## 種類の定義(`kinds/`)

- 種類の定義は、公開サイトのコードを正とし、`defineKind` で書く。型は TypeScript が定義から推論し、型を書き出すコマンドは作らない(ユーザーと決めた)。
- 項目は zod のスキーマにする。項目の関数(`text` など)は、contract の値のスキーマ(`content-values.ts`)を `clone()` して返し、そのスキーマをキーにして、項目の定義(キーを除いたもの)を `WeakMap` に入れる。`defineKind` は、項目の並びをそのまま `z.object` に渡して中身のスキーマにし、`WeakMap` から項目の定義を読んで、CMS に送る定義を作る。
  - 中身の型は、zod の推論から得る。定義の JSON から型を計算する型を別に書くと、型と検査が別々の場所にあることになり、両者が合っていることを型検査で確かめられない(最後にキャストが要る)。
  - 項目の関数で作っていないスキーマ(素の zod や、`.min()` などで絞ったもの)は、`defineKind` で失敗させる。公開サイトだけにある検査を、CMS は知らずに保存してしまうため。
- `defineKind` は、作った定義を contract の `kindDefinition` で検査する。CMS が断る名前や入れ子を、デプロイを待たずに、定義を読み込んだ時点で知らせる。
- 公開サイトの中身のスキーマと、CMS が定義の JSON から作るスキーマ(contract の `toContentSchema`)が、同じ値を同じように扱うことを、テストで確かめる。
- `defineKind`・`group`・`repeat` は、渡された項目のオブジェクトの写しを取ってから、定義とスキーマを作る。渡したオブジェクトを後から書き換えると、CMS に送った定義と、公開サイトの中身のスキーマが食い違うため(Codex のレビューで見つかった)。symbol のキーの項目は、定義に入らないので断る。
- 項目の順は、`fields` のオブジェクトに書いた順にする。CMS には配列で送る(jsonb がキーの順を保たないため。server の kinds の `DECISIONS.md`)。

## 公開 API の client(`fixed-pages/`)

- CMS の公開 API は、保存した中身を、今の定義に無いキーも含めてそのまま返す(server の fixed-pages の `DECISIONS.md`)。client が、自分の定義で検査して、定義に無いキーを取り除く。新しい定義を送ってから新しいサイトに切り替えるまでの間も、古いサイトが自分の定義で読めるように。
- 中身は、受け取った後に、渡された種類の中身のスキーマで検査してから返す。検査しなければ、推論した型を付けるのにキャストが要る。CMS は保存のときに検査しているので、ここで失敗するのは、公開サイトの定義が CMS に送った定義と食い違うとき(送り忘れなど)だけで、そのときは失敗として投げる。
- 無いページは `undefined` を返す。公開していないページと区別しない(server の約束のまま)。CMS の想定外の失敗は投げる。
- CMS へのリクエストは、リダイレクトを追わない(`redirect: "error"`)。内部用のポートの CMS はリダイレクトを返さず、返ったら設定の誤りなので、ほかの場所に送り直さない(Codex のレビューで見つかった)。
- oRPC の client(RPC のプロトコル)で呼ぶ。contract の型をそのまま使え、OpenAPI の handler を server に足さずに済む。

## CLI(`cli/`)

- `analemma push-kinds <定義のファイル>` で、定義のファイルの default export の種類を、デプロイ用 API に送る。
- 定義のファイルは、実行するときにしかパスが分からないので、`import()` で読み込む(`main.ts` の1か所だけ。`project/no-dynamic-import` を理由付きで抑制する)。抑制の理由のとおり、境界を守る `no-restricted-imports` を避けるためではない。
- トークンは環境変数(`ANALEMMA_DEPLOY_TOKEN`)だけで受け取る。引数で受け取ると、シェルの履歴やプロセスの一覧に残る。URL は、環境変数(`ANALEMMA_URL`)か `--url` で受け取る。
- 送る前に、トークンの形(`{id}.{secret}`)を確かめ、違えば値を出さずに使い方の誤りで終える。改行の混ざった値を Node の fetch に渡すと、ヘッダーの例外の文に値が入り、標準エラーに出る(Codex のレビューで見つかった)。
- CMS へのリクエストは、リダイレクトを追わない(`redirect: "error"`)。リダイレクトの先に、定義とトークンを送り直さないため(Codex のレビューで見つかった)。
- URL にユーザー名やパスワードが入っていれば、使い方の誤りにする。Node の `Request` が投げる例外の文に URL が入り、CI のログに出るため(Codex のレビューで見つかった)。
- 引数は、知らない option、値の無い `--url`、2つ以上の `--url` を、使い方の誤りにする。`--url` を打ち間違えたときに、環境変数の URL に黙って送らないため(Codex のレビューで見つかった)。
- 終了コードは、受け付けられたら 0、断られた(合わないページがある・トークンが違う・定義のファイルが読めない)ら 1、使い方の誤りなら 2。CMS に届かないときと、CMS の想定外の失敗は、Node が失敗を書いて 1 で終わる。
- 入出力(引数・環境変数・読み込み・fetch・出力)は、`main.ts` が `runCli` に渡す。`runCli` のテストは、contract を実装した偽の CMS(`@orpc/server`)を相手に流す。
- CLI だけは Node の API(`node:util` など)を使う。lint の設定で、`src/cli/` に Node の API を許し、`process.env` は `main.ts` でだけ読める(`tooling/DECISIONS.md`)。

## npm で公開する形

- `package.json` の `exports`・`bin`・`files` を、`dist/` に書き出したものに向ける。リポジトリの中で client を import するワークスペースは無いので、`dist/` に向けても困らない。
- JS は Bun で bundle する(SDK と CLI を別々に)。`zod` と `@orpc/*` は外に出し、contract は中に含める。Node は、拡張子の無い相対 import と、`node_modules` の中の TypeScript を読めないため。CLI には、ビルドのときに shebang を足す(ソースに書くと、単独の行のコメントとして lint に止められる)。
- 型(`.d.ts`)は `tsc`(`tsconfig.build.json`)で書き出す。型は `@analemma/contract` を参照するので、client を公開するには、contract も公開する必要がある。
- 公開するときは `bun publish` を使う。`package.json` の `workspace:*` を、公開するバージョンに書き換えるのは Bun だけで、`npm pack`・`npm publish` は `workspace:*` を残し、利用者の側で依存を解決できない(Codex のレビューで見つかった)。
- `private: true` は、公開するときに外す(ユーザーが決めるまで公開しない)。

## TypeScript の設定

- `tsconfig.json` はテストと CLI を含めて Bun の型を足す。`tsconfig.src.json` は、テストと CLI を除いた SDK を、Web 標準の型(fetch・URL など。TypeScript では `DOM` の lib にある)だけで検査する。Bun と Node の型を使うコードが SDK に入ると、ここで落ちる。ブラウザだけの API(`window` など)は、型付きの lint が `tsconfig.json`(`DOM` の lib を持たない)で読むので、error 型として止まる。

## 割り切ったこと

- **返した定義とスキーマの書き換え**:`defineKind` が返す `definition` や、項目の関数が返す zod のスキーマ(`group` の `.shape` など)を、後から書き換えると、CMS に送る定義と、公開サイトの中身のスキーマが食い違う。公開サイトのコードを書くのはサイトの持ち主で、型も `definition` を書き換える使い方を想定していないので、凍結する(`Object.freeze`)ことまではしない(Codex のレビューで挙がった)。
- **依存の型の検査**:oRPC の型は、optional な peer dependency の `@opentelemetry/api` を参照する。`skipLibCheck` を切った利用者は、それを入れないと型検査が通らない。SvelteKit の既定の設定は `skipLibCheck` を入れているので受け入れる。
- **bundle に入る、ほかのアクセス区分の contract**:SDK と CLI の bundle には、contract の全体(管理用 API と認証用 API の route の定義を含む)が入る。contract は公開するリポジトリにあり、秘密は含まないので、大きさの問題だけとして受け入れる。contract を、アクセス区分ごとに読める形に分けるときに見直す。
- **bin と shebang のテスト**:テストは `runCli` を直に呼ぶので、`bin` のパス、ビルドで足す shebang、相対パスでの定義のファイルの読み込みは確かめていない。ビルドした CLI を Node で流し、本物の server の内部用のポートに送る確認は、手で行った。
- **Node の `node16` の解決**:`.d.ts` の相対 import は拡張子を持たない(lint が拡張子を禁じている)。`moduleResolution` が `node16`・`nodenext` の利用者は、型を解決できない。公開サイト(SvelteKit)は `bundler` で解決するので、公開の手順を決めるときに見直す。
