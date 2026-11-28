# 決めたことと理由(client)

## 種類の定義(`kinds/`)

- 種類の定義は、公開サイトのコードを正とし、`defineKind` で書く。型は TypeScript が定義から推論し、型を書き出すコマンドは作らない(ユーザーと決めた)。
- 項目は zod のスキーマにする。項目の関数(`text` など)は、contract の値のスキーマ(`content-values.ts`)を `clone()` して返し、そのスキーマをキーにして、項目の定義(キーを除いたもの)を `WeakMap` に入れる。`defineKind` は、項目の並びをそのまま `z.object` に渡して中身のスキーマにし、`WeakMap` から項目の定義を読んで、CMS に送る定義を作る。
  - 中身の型は、zod の推論から得る。定義の JSON から型を計算する型を別に書くと、型と検査が別々の場所にあることになり、両者が合っていることを型検査で確かめられない(最後にキャストが要る)。
  - 真偽値の項目の関数(`boolean`)は、値のスキーマに既定値を付けた(`.default()`)スキーマを返す。中身の型は、値の無いページでも boolean になる。`optional` で包むと、型でも、実行したときも断る(server の kinds の `DECISIONS.md`)。
  - 項目の関数で作っていないスキーマ(素の zod や、`.min()` などで絞ったもの)は、`defineKind` で失敗させる。公開サイトだけにある検査を、CMS は知らずに保存してしまうため。
- `defineKind` は、作った定義を contract の `kindDefinition` で検査する。CMS が断る名前や入れ子を、デプロイを待たずに、定義を読み込んだ時点で知らせる。
- 公開サイトの中身のスキーマと、CMS が定義の JSON から作るスキーマ(contract の `toContentSchema`)が、画像以外の値を同じように扱うことを、テストで確かめる。画像は、CMS が保存時に ID の形を検査し、client は公開 API が返した値を検査する。
- `defineKind`・`group`・`repeat` は、渡された項目のオブジェクトの写しを取ってから、定義とスキーマを作る。渡したオブジェクトを後から書き換えると、CMS に送った定義と、公開サイトの中身のスキーマが食い違うため(Codex のレビューで見つかった)。symbol のキーの項目は、定義に入らないので断る。
- 項目の順は、`fields` のオブジェクトに書いた順にする。CMS には配列で送る(jsonb がキーの順を保たないため。server の kinds の `DECISIONS.md`)。

## 公開 API の client(`public-api/`)

- CMS の公開 API は、今の定義にある画像の項目を解き、ほかの値は定義に無いキーも含めてそのまま返す(server の fixed-pages の `DECISIONS.md`)。client が、自分の定義で検査して、定義に無いキーを取り除く。新しい定義を送ってから新しいサイトに切り替えるまでの間も、古いサイトが自分の定義で読めるように。
- 中身は、受け取った後に、渡された種類の中身のスキーマで検査してから返す。検査しなければ、推論した型を付けるのにキャストが要る。CMS は保存のときに検査しているので、ここで失敗するのは、公開サイトの定義が CMS に送った定義と食い違うとき(送り忘れなど)だけで、そのときは失敗として投げる。
- 画像の項目を定義から消すと、CMS はそのキーに保存した ID を返す。切り替え前の公開サイトでは、その画像を取得できなかったものとして扱う。必須の項目を消したときも、ページのほかの中身を読めるようにするため。
- 画像とシリーズの取得でも、固定ページと同じく、ID・slug の形に合わないときと `NOT_FOUND` には `undefined` を返す。公開サイトは取得できたかどうかで表示を切り替えられる。
- 無いページは `undefined` を返す。公開していないページと区別しない(server の約束のまま)。CMS の想定外の失敗は投げる。
- slug の形に合わない名前も、公開 API を呼ばずに `undefined` を返す。公開サイトは URL の一部を slug として渡し、形に合わない URL も、無いページと同じく 404 にしたいだけ。呼ぶと、CMS が入力の誤りとして断り、client はそれを投げるので、404 にするには、公開サイトが自分で形を確かめる必要がある。client で確かめれば、公開サイトごとに同じ決まりを書かずに済む。形は contract の `fixedPageSlug` で確かめ、CMS と同じ決まりを使う。
- CMS へのリクエストは、リダイレクトを追わない(`redirect: "error"`)。内部用のポートの CMS はリダイレクトを返さず、返ったら設定の誤りなので、ほかの場所に送り直さない(Codex のレビューで見つかった)。
- oRPC の client(RPC のプロトコル)で呼ぶ。contract の型をそのまま使え、OpenAPI の handler を server に足さずに済む。

## CLI(`cli/`)

- `analemma push-kinds <定義のファイル>` で、定義のファイルの default export の種類を、デプロイ用 API に送る。
- 定義のファイルは、実行するときにしかパスが分からないので、`import()` で読み込む(`main.ts` の1か所だけ。`project/no-dynamic-import` を、ルールを外すファイルの一覧で外している)。`no-restricted-imports` の境界を避けるための `import()` ではない。
- トークンは環境変数(`ANALEMMA_DEPLOY_TOKEN`)だけで受け取る。引数で受け取ると、シェルの履歴やプロセスの一覧に残る。URL は、環境変数(`ANALEMMA_URL`)か `--url` で受け取る。
- 送る前に、トークンの形(`{id}.{secret}`)を確かめ、違えば値を出さずに使い方の誤りで終える。改行の混ざった値を Node の fetch に渡すと、ヘッダーの例外のメッセージに値が入り、標準エラーに出る(Codex のレビューで見つかった)。
- CMS へのリクエストは、リダイレクトを追わない(`redirect: "error"`)。リダイレクトの先に、定義とトークンを送り直さないため(Codex のレビューで見つかった)。
- URL にユーザー名やパスワードが入っていれば、使い方の誤りにする。Node の `Request` が投げる例外のメッセージに URL が入り、CI のログに出るため(Codex のレビューで見つかった)。
- 引数は、知らない option、値の無い `--url`、2つ以上の `--url` を、使い方の誤りにする。`--url` を打ち間違えたときに、環境変数の URL に黙って送らないため(Codex のレビューで見つかった)。
- 終了コードは、受け付けられたら 0、断られた(合わないページがある・トークンが違う・定義のファイルが読めない)ら 1、使い方の誤りなら 2。CMS に届かないときと、CMS の想定外の失敗は、Node が失敗を書いて 1 で終わる。
- 入出力(引数・環境変数・読み込み・fetch・出力)は、`main.ts` が `runCli` に渡す。`runCli` のテストは、contract を実装したテスト用の CMS(`@orpc/server`)を相手に流す。
- CLI だけは Node の API(`node:util` など)を使う。lint の設定で、`src/cli/` に Node の API を許し、`process.env` は `main.ts` でだけ読める(`tooling/DECISIONS.md`)。

## npm で公開する形

ここにあるのは、npm で公開する手順を決めるまでの仮の形。`bin` の名前、型の配り方(型も1つのファイルにまとめるか、contract も公開するか)、CLI の文言の言語は、npm で公開する手順と一緒に、ユーザーと決める(直下の `AGENTS.md` の「まだ決めていないこと」)。

- `package.json` の `exports`・`bin`・`files` を、`dist/` に書き出したものに向ける。リポジトリの中で client を import するワークスペースは無いので、`dist/` に向けても困らない。
- JS は Bun で bundle する(SDK と CLI を別々に)。`zod` と `@orpc/*` は external にし(bundle に含めず)、contract は bundle に含める。Node は、拡張子の無い相対 import と、`node_modules` の中の TypeScript を読めないため。CLI には、ビルドのときに shebang を足す(ソースに書くと、単独の行のコメントとして lint に止められる)。
- 型(`.d.ts`)は `tsc`(`tsconfig.build.json`)で書き出す。型は `@analemma/contract` を参照するので、client を公開するには、contract も公開する必要がある。contract も `bun pm pack` で固められ、型を build した `.d.ts` で出す(`packages/contract/DECISIONS.md`)。
- build は、先に contract の build を流し、contract の `.d.ts` も作り直す。このフォルダをつないで使う公開サイトの tsc は、client の `.d.ts` から contract の `.d.ts` を読むので、client だけを作り直すと、contract の型が古いまま残る。
- ビルドした CLI は、CI(`check.yml`)で1回流す。`package.json` の `bin` のパスのファイルを shebang で直に実行し、相対パスで渡した、名前だけが形に合わない定義のファイルで、終了コード 1 になり、その名前の誤り(`0.name`)が出ることを確かめる。定義のファイルを読み、default export の配列の中身まで検査したことが分かる(読み込みが壊れて、配列に届かないときは、別の文言になる)。bin のパス・shebang・bundle の external・定義のファイルの読み込みは、`runCli` を直に呼ぶテストでは通らないため。CMS に送るところは `runCli` のテストが確かめるので、CI では送らない。
- 公開するときは `bun publish`、固めるときは `bun pm pack` を使う。`package.json` の `workspace:*` を、contract の `version` に書き換えるのは Bun だけで、`npm pack`・`npm publish` は `workspace:*` を残し、利用者の側で依存を解決できない。
- 固めたものに、build した SDK と CLI と、SDK のソースごとの `.d.ts` と、README と package.json だけが入り、`exports` と `bin` の指すファイルがどれも入り、contract への依存が contract の `version` になることと、build が contract の `.d.ts` を今のソースから作り直し、contract の `dist/` に固めた `.tgz` を消さないことを、テスト(`__tests__/pack.test.ts`)で確かめる。テストは、contract と同じく `src/` の外に置く(`packages/contract/DECISIONS.md`)。
- `private: true` は、公開するときに外す(ユーザーが決めるまで公開しない)。

## TypeScript の設定

- `tsconfig.json` はテストと CLI を含めて Bun の型を足す。`tsconfig.src.json` は、テストと CLI を除いた SDK を、Web 標準の型(fetch・URL など。TypeScript では `DOM` の lib にある)だけで検査する。Bun と Node の型を使うコードが SDK に入ると、ここで落ちる。ブラウザだけの API(`window` など)は、型付きの lint が `tsconfig.json`(`DOM` の lib を持たない)で読むので、error 型として止まる。

## 割り切ったこと

- **返した定義とスキーマの書き換え**:`defineKind` が返す `definition` や、項目の関数が返す zod のスキーマ(`group` の `.shape` など)を、後から書き換えると、CMS に送る定義と、公開サイトの中身のスキーマが食い違う。公開サイトのコードを書くのはサイトの持ち主で、型も `definition` を書き換える使い方を想定していないので、凍結する(`Object.freeze`)ことまではしない(Codex のレビューで挙がった)。
- **依存の型の検査**:oRPC の型は、optional な peer dependency の `@opentelemetry/api` を参照する。`skipLibCheck` を切った利用者は、それを入れないと型検査が通らない。今は npm で公開しておらず、使う予定の公開サイトは `skipLibCheck` を入れているので、受け入れる。npm で公開する手順を決めるときに、型の配り方と一緒に、README に書くか、参照を消すかを決める。
- **bundle に入る、ほかのアクセス区分の contract**:SDK と CLI の bundle には、contract の全体(管理用 API と認証用 API の route の定義を含む)が入る。contract は公開するリポジトリにあり、秘密は含まないので、大きさの問題だけとして受け入れる。contract を、アクセス区分ごとに読める形に分けるときに見直す。
- **`moduleResolution` が `node16` の利用者**:`.d.ts` の相対 import は拡張子を持たないので、`moduleResolution` が `node16`・`nodenext` の利用者は、型を解決できない。今は npm で公開しておらず、使う予定の公開サイトは `bundler` で解決する。npm で公開する手順を決めるときに、型を1つのファイルにまとめるか、`packages/client` の相対 import に拡張子を書く(lint の `import/extensions` を、このワークスペースでは外す)かを決める。
