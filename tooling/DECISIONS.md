# 決めたことと理由(tooling)

## lint の設定

設定は直下の `oxlint.config.ts`。型付きのルールは fixture では確かめられない(fixture は型を使わずに検査する)。

- **設定を TypeScript で組み立てる**:設定は1つの JSON ではなく、`oxlint.config.ts` が `tooling/lint/config/` のモジュール(組み込みのルール・自作のルール・ワークスペースごとの `overrides`・server の `overrides`・API の制限の部品)を組み立てる。Oxlint の `overrides` は、同じルールを書くと前の options を丸ごと置き換えるので、場所ごとに少しずつ違う制限(Bun・Node・Drizzle・oRPC の builder の import の禁止など)を、JSON では毎回全部書き写していた。部品にすれば1か所から組み立てられ、写し間違いが起きない。管理画面の Tailwind CSS の class の検査も、場所ごとに違う制限を同じ部品から組み立てる(デザインシステムのレビューで決めた)。`defineConfig` の型で、Oxlint が型を持つ組み込みのルールの options は型検査に掛かる(JS のプラグインのルールの名前と options は、型が `unknown` なので掛からない)。
- 移したときに、組み立てた設定が、前の `.oxlintrc.json` と同じ値になることを確かめた(違いは、`$schema` を消したことと、下の `import/extensions` の `overrides` を足したことだけ)。
- 設定のファイルは、Oxlint が Node の `import()` で読む。Node は TypeScript の型を消して流すだけで、拡張子の無い相対 import を解決しないので、設定のファイル(`oxlint.config.ts`・`oxlint.fixtures.config.ts`・`tooling/lint/config/`)の相対 import には `.ts` を付ける(fixture は `tooling/lint/fixtures/{valid,invalid}/tooling/lint/config/`)。`import/extensions` も、そこでだけ `.ts` を求める(`tooling/lint/**/*.mjs` に `.mjs` を求めるのと同じ理由)。`overrides` は options を丸ごと置き換えるので、`.json`・`.mjs` などの決まりも同じ部品から書き足す。TypeScript の設定のファイルを読むには、型消去を既定で使う Node が要る(README の「開発」。CI の runner には Node 24 が入っている)。
- fixture のテストは、Oxlint が設定を読めずに JSON の結果を出さなかったときに、Oxlint の出力をそのまま失敗の文言に入れる。Node が古いと、JSON を読めないという失敗だけが出て、原因が分からなかった。
- 1つのファイルのコードは400行までなので、ルールの一覧も、組み込みのプラグインのルール(`core-rules.ts`)と、自作と JS のプラグインのルール(`project-rules.ts`)に分ける。

- **自作のルール**(`tooling/lint/rules/`)
  - `no-standalone-comment`:単独の行のコメントとブロックコメントを禁止し、行末のコメントは40文字までにする。lint への指示(`oxlint-disable` など)と `@ts-expect-error` は除く。TSDoc は宣言・型のプロパティ・メンバーの直前にだけ書ける。分割の見出し(10本以上の `-` の罫線・見出しの行・罫線の3行)は、コードが200行を超えるファイルでだけ許し、400行を超えるファイルには1つ以上を求める。行数は、空行とコメントだけの行を除いて数える(`eslint/max-lines` の `skipBlankLines`・`skipComments` と同じ数え方)。見出しの行は、文字か数字を含み、lint への指示ではないものに限り、40文字までにする。必須の条件を満たすのは、後ろにコードが続く見出しだけ(ファイルの末尾に置いただけの見出しは数えない)。改行は LF・CRLF・CR・U+2028・U+2029 のどれでも1行と数える。TSDoc と宣言のあいだに見出しを挟むと、宣言の直前に無い TSDoc の診断を出す。
  - `tsdoc-role-only`:TSDoc の説明とタグを、それぞれ1行・1文・60文字までにし、条件・例・補足・理由の言い回しと、`@param`・`@returns`・`@deprecated` 以外のタグを禁止する。言い回しは正規表現で見る(「割り切ったこと」)。「起動時に組み立てる」のような定義まで止めていたので、「時に」「ときに」は条件の言い回しから外した。`test.if` のようなコードの名前で引っかからないよう、バッククォートで囲んだ部分は言い回しの検査から外す。
  - `no-markup-test`:テストで、test id による検索、DOM のたどり方(`querySelector` など)、クラス名や HTML の中身、スナップショットを禁止する。
  - `max-code-lines`・`file-length-limit`:ファイルのコードの行数(空行とコメントだけの行を除く)に上限を設ける。同じ実装を、400行(`max-code-lines`。1行目に理由付きで抑制できる)と800行(`file-length-limit`。抑制できない)の2つの名前で使う。Oxlint の `eslint/max-lines` は、複数行のコメントや CR だけの改行で数え方が食い違ったので使わない。
  - `require-disable-reason`:lint の抑制に、ルールの名前と `--` の後の理由を求める。ルールの名前と説明の区切りは、Oxlint と同じ読み方にする(カンマと空白で区切り、`--` か前後に空白のある `-` から説明が始まる。`/` の無い名前はプラグイン名を除いた部分で照らし合わせる)。抑制できないルール(`file-length-limit`・`no-standalone-comment`・このルール自身)の抑制を止め、`max-code-lines` の抑制は1行目の `// oxlint-disable` の形だけを許す。
  - `no-focused-test`:`test.only`・`describe.skip`・`test.todo`・`test.if` などを禁止する。
  - `no-cross-workspace-import`:相対パスで、自分のワークスペース(`apps/<名前>`・`packages/<名前>`)の外のファイルを import することを禁止する。Bun の isolated linker はパッケージ名での import しか縛らないので、相対パスなら server のコードを contract から読めてしまう。
  - `require-sibling-test`:管理画面の `.ts` が関数を export するなら、同じフォルダの `__tests__` に `.test.ts` を求める。表示を出し分ける `.tsx`(JSX を返す条件分岐がある)には、`__tests__` に `.test.tsx` を求める。テストのファイルは、中に `test(` か `it(` があるときだけ数える。lint を通すためだけの空のファイルやフォルダでは通らない。
  - `test-location`:テストのファイルを `__tests__` の直下に置かせ、`__tests__` にはテストのファイルだけを置かせ、`__tests__` の中にフォルダを作らせない。テストがテストするコードと同じフォルダにあるかまでは見ない(API 越しのテストは、1つのファイルに対応しないため)。
  - `max-exported-functions`:1つのファイルが export できる関数を2つまでにする(型は数えない)。server の「1ファイルに、1つの procedure か1つの関数」を、この上限で保つ。
  - `no-inline-parameter-type`:関数の引数に、インラインのオブジェクト型を書かせず、名前付きの型にさせる。
  - `no-catch-outside-entry`:try/catch の catch 節と、`.catch()` の呼び出しを禁止する(server だけ)。想定外の失敗は throw して入口で 500 とログにする約束で、これまで lint で止めていなかったので、WebCrypto の鍵の読み込みの `.catch(() => undefined)` が約束をすり抜けていた。`finally` だけの try は、後始末のために許す。`.then(a, b)` の2つ目の引数は、`promise/prefer-catch` が `.catch()` に書き直させるので、ここで止まる。
    - 入口と dispatcher では、Oxlint の設定の `overrides` でこのルールを外す。入口に数えるのは、HTTP の入口(`src/app.ts`)、コマンドの入口(`src/main.ts`・`src/enroll.ts`・`src/db/migrate.ts`)、起動のときの環境変数の検証(`src/platform/parse-database-url.ts`)。環境変数の検証は、起動の入口で外からの値をデコードする場所なので入口に数える。`.env` のパスワードの `%` のような、人が普通にする書き間違いを、パスワードを出さない決まった文言で知らせるため、`decodeURIComponent` の失敗を受け止める。dispatcher(ビジネスイベントを配る場所)は、作るときに足す。
    - テストのファイルと、テストの部品(`src/test-client/`・`src/platform/test-database/`)でも外す。テストは失敗を値として受け取って確かめるので、握りつぶしではない。本番のコードは、この2つのフォルダを import できない(`tooling/structure/` のテストが止める)。import できると、`catchErrorCode` のような部品を通して、このルールをすり抜けられる。
  - `no-dynamic-import`:`import()` による動的な import を禁止する。境界を守る `no-restricted-imports` は動的な import を見ないので、`import()` なら Drizzle や Bun の API を、決めた場所の外から読めてしまう。今のコードでは、client の CLI の入口(`packages/client/src/cli/main.ts`)の1か所だけで、理由付きで抑制している(利用者の定義のファイルは、実行するときにしかパスが分からない)。
- **TSDoc のタグの検査**(eslint-plugin-jsdoc):`@param` の名前が引数と合うこと(`check-param-names`)、1つでも書いたら全部の引数に書くこと(`require-param`)、何も返さない関数に `@returns` を書かないこと(`require-returns-check`)、タグに型を書かないこと(`no-types`。型は TypeScript が持つ)。
- **使える API の制限**
  - `node:*` と Bun 専用のモジュールは、contract・client・管理画面で import できない。Node と Bun のグローバルも、server と tooling だけで有効にする。
  - 管理画面の `.ts` から `react`・`react-dom` を import できない。フックやコンポーネントは `.tsx` に置き、`.ts` をテストできるロジックだけにする。
  - `console`(ログは context で渡す logger を使う)、`process.env`(環境変数は起動時に検証する1か所だけで読む)、引数のプロパティの書き換えを禁止する。
- **足したルール**:`no-unnecessary-condition`(要らない `?.` や条件)、`no-abusive-eslint-disable`(ルールを指定しない抑制)、React の `only-export-components`・`no-danger`・`button-has-type`。
  - `typescript/return-await`(`in-try-catch`):`try`・`finally` の中と `await using` の後で、`await` を省いた `return` に診断を出す。省くと、返した処理が終わる前に後始末が走り、使っている最中の接続が閉じる。Postgres の用意で実際にこの誤りがあった。型は同じ `Promise` なので型検査では止まらない。ほかの場所の `return` には診断を出さない。テストでも外さない(テストで出るのも同じ誤り)。型付きのルールなので fixture では確かめられない。
- **変えた設定**
  - `no-underscore-dangle`:`_tag` だけ許す。想定内の失敗を `_tag` 付きの判別共用体で表すため。
  - `switch-exhaustiveness-check`:網羅している switch に `default` を書けないようにし、判別共用体でない値の switch には `default` を求める。`default` があると、`_tag` の値を足したときに扱い忘れが見つからない。
  - `require-unicode-regexp`:正規表現に `v` フラグを求める。和文を扱うので、サロゲートペアや Unicode のプロパティを正しく扱える必要がある。
  - `no-await-in-loop`:有効にする。ループの中の直列の I/O(N+1)を見つける。
  - `consistent-type-assertions`:オブジェクトリテラルへの `as` を禁止する。`as` を付けると余計な項目の検査が効かなくなり、キーの綴り間違いが素通りする。`satisfies` か型の注釈を使う。
  - `no-warning-comments`:探す語を `FIXME`・`XXX` だけにし、`TODO` は書けるようにする(ユーザーが決めた)。tsrs の不具合で手で書いた型のように、直す条件がはっきりした「後で戻すこと」を、その場に残すため。直すべき誤りを示すコメント(`FIXME`・`XXX`)は残させない。
  - `no-unused-vars`:`await using` で受けた変数は、使っていなくても診断を出さない(`ignoreUsingDeclarations`)。後始末のためだけに受ける変数は、受けること自体が使い道。`_` を付けて逃がすと、今度は `no-underscore-dangle` に掛かった。
- **テストでも緩めないルール**
  - `no-unsafe-*`:bun-types は、非対称の matcher(`expect.any()`・`expect.stringContaining()` など)の型 `AsymmetricMatcher` を、型の食い違いを起こさないために、わざと `any` の別名にしている。テストで使うと `no-unsafe-*` に掛かるので、非対称の matcher は使わず、`toMatchObject` や具体的な値で確かめる。
  - `await-thenable`:Bun 1.4 の `expect(…).rejects`・`resolves` は、Promise が settled になるまでその場で待つ(50ms 後に失敗する Promise でも、`await` なしで正しく確かめた)。bun-types が戻り値を `void` と型付けしているのは、この動きに合っている。`await` を付けずに書けば、このルールにも掛からない。
- **テストで緩めるルール**:テストは、ユーザーの判断で製品のコードより lint を緩めてよい。テストの書き方とぶつかる一般のルールは、テストのファイルの `overrides` で外し、テストを曲げない。テストのためのルール(`no-focused-test`・`no-markup-test`・`test-location`)と、抑制できないルールは緩めない。
  - `no-non-null-assertion`:テストでは、あると分かっている値を読む場面が多い。無ければテストが落ちるので、それで足りる。
  - `no-await-in-loop`:テストでは、順に待つこと自体を確かめたい場面がある。
  - `consistent-type-assertions`:項目の一部だけを持つ作り物を `as` で作れるようにする。
  - `unicorn/prefer-type-error`:テストの中で throw する値の型は、テストの都合で決める。
- **自作のルールのファイル(`tooling/lint/**/*.mjs`)で変えるルール**
  - `import/extensions`:`.mjs` の拡張子を付ける。Node の ES モジュールは、相対 import に拡張子が無いと読み込めない。全体に掛けると、`.mjs` で配布されているパッケージ(oRPC など)の import にまで拡張子を求められたので、範囲を絞った。
  - `typescript/no-unsafe-*` と `strict-boolean-expressions` を外す。Oxlint は JS プラグインへ型の無い構文木を渡すので、型付きのルールを当てても意味が無い。
- **server の境界**(`apps/server/src/` に `no-restricted-imports`・`no-restricted-globals`・`no-restricted-properties` を掛ける。上書きの設定は、後に書いたものが勝つ)
  - Drizzle と DB のドライバを値として import できるのは、`*.query.ts`・`src/db/`・`src/platform/` だけ。型だけの import は、mapper のためにどこでも許す。
  - Bun 専用の API(`Bun` と `HTMLRewriter` のグローバル、`globalThis.Bun`、`bun` と `bun:*` のモジュール、`hono/bun`)を使えるのは、`src/platform/` と `src/main.ts` だけ。テストのための `bun:test` はどこでも使える。
  - 素の oRPC の builder(`implement`・`os`・`Builder`)を値として使えるのは、`src/procedures.ts` と `src/router.ts` だけ。型だけの import は許す。
  - contract・client・管理画面にも、同じ形で Bun の API と `node:*` の禁止を掛ける。
  - ただし、client の CLI(`packages/client/src/cli/`)は Node で動かすコマンドなので、`node:*` の import と Node のグローバルを許す(Bun の API は禁じたまま)。`process.env` は、CLI の入口の `main.ts` でだけ読める。CLI では `node:process` の import を禁じ、グローバルの `process` を使わせる(下の `node/no-process-env` の穴をふさぐため。Codex のレビューで挙がった)。fixture は `packages/client/src/` の下に置く。
  - `node/no-process-env` は、グローバルの `process` の `env` だけを見る。`import process from "node:process"` で読み込んだ `process` の `env` には診断を出さない(fixture を書いていて分かった)。今は server と CLI のどちらも、そう書いていない。
- **TypeScript の検査と lint のルールがぶつかったら、TypeScript の方を取る**(ユーザーが決めた):型の正しさを決めるのは `tsc` で、lint のルールは、書いているときにすぐ気づくための早めの知らせ。lint に合わせると、型の検査が既に保証していることのために、余計な `return` や `default` やキャストを書かされ、かえって型の検査を弱める。
- **tsrs の不具合**:tsrs は、tsc が Bun の型から読める WebCrypto の型の名前(`JsonWebKey` など)を解決できず、error 型として `no-unsafe-*` の診断を出す。TypeScript の検査とルールのぶつかりではなく、tsrs の不具合なので、ルールは外さない。使う項目だけの型を手で書き、tsrs が読めるようになったら標準の型に戻す(`src/features/auth/DECISIONS.md`)。
- **外したルール**
  - `typescript/consistent-return`:網羅した switch で値を返す関数に、末尾の `return` を求める。`switch-exhaustiveness-check` は網羅した switch に `default` を書かせないので、両方を満たすには、switch をやめて関数の表で書くしかなかった(パスキーの認証で実際に起きた)。返し忘れは、tsc の `noImplicitReturns` と戻り値の型が、網羅した switch を分かったうえで止める。型付きのルールなので fixture では確かめられない。網羅した switch で値を返す関数に、外す前は診断が出て、外した後は出ないことと、返し忘れを tsc が止めることを、一時的なファイルで確かめた。
  - `unicorn/no-useless-undefined`:TypeScript では、`Promise<Session | undefined>` のように `undefined` を明示しないと型が合わない場面がある。server の骨組みを作るときに、正しいコードが書けなくなった。
  - `typescript/promise-function-async`:一度足したが外した。`require-await` と組み合わさると、すぐに値を返す Promise(`() => Promise.resolve(undefined)`)をどう書いても、どちらかのルールに引っかかった。
  - `eslint/no-inline-comments`:行末の短いコメントを許す方針と正面から食い違う。コメントは `no-standalone-comment` で扱う。
  - 同じ中身のルールが2系統あるものは、型付きの方か片方だけを残す(`require-await`・`prefer-promise-reject-errors`・`no-implied-eval`・`prefer-includes`・`prefer-string-starts-ends-with`・`no-lonely-if`・`no-negated-condition`)。1つの違反が2回報告されるのを防ぐ。
- **import の並び**:oxfmt の `sortImports` に任せ、eslint-plugin-perfectionist は外した。並びは整形の仕事で、保存のたびに直る。`{ }` の中の並びは見た目だけなので揃えない。
- **ファイル名**:`unicorn/filename-case` で kebab-case を求める。
- **fixture のテスト**:`tooling/lint/__tests__/` に、ルールの分類ごとのテストのファイルを置く。lint の実行と結果の読み取りは `tooling/lint/fixture-lint.ts` にまとめる。正常系は、診断が0件であることに加えて、fixture を全部 lint したことも確かめる。分割の見出しのように、同じルールが何通りもの診断を出すものは、診断の文言と件数まで確かめる。
- **fixture**:ルールの分類ごとのフォルダ(`comments/`・`tsdoc/`・`jsdoc/`・`functions/`・`imports/`・`syntax/`・`tests/`)に分け、server や管理画面だけに掛かるルールの fixture は、`apps/server/src/` のように同じパスを再現したフォルダに置く。`tooling/lint/fixtures/` は `bun test` の対象から外す(`bunfig.toml` の `pathIgnorePatterns`)。描画するライブラリを import する fixture など、実行できないものを置くため。

## Stop hook

Claude Code では、作業の終わりに `tooling/hooks/stop-check.ts` が `bun run check` を流す(設定は `.claude/settings.json`)。エージェントは終わりの手順を忘れやすい。失敗したら作業を止めて直させ、2回目も失敗したら止め続けずに警告を出す。直せないまま堂々巡りになるのを防ぐため。

- 作業ツリーに変更が無いときは流さない。会話だけのやり取りでも、毎回 check を待たせないため。コミットした後の変更は CI が流す。
- `git status` が失敗したときは、変更があるものとして流す。

## 抑制できない約束の検査

Oxlint には、抑制のコメントを無視して実行する仕組みが無い。`oxlint-disable-line project/require-disable-reason -- 理由` のように、抑制を禁じるルールの診断さえ、コメント1つで消せてしまう。設定の `overrides` で切ることも、`foo-min.ts` のような Oxlint が飛ばす名前にすることもできる。そこで、次の約束は `tooling/structure/` のテストでも検査する。テストは `git ls-files` で一覧にした全ソースを oxc-parser で読むので、抑制のコメントにも設定にも左右されない。

- コードが800行を超えない。400行を超えるなら、1行目に理由付きの `// oxlint-disable project/max-code-lines -- 理由` があり、後ろにコードが続く分割の見出しがある。
- 抑制にルールの名前と理由があり、抑制できないルールを抑制していない。
- Oxlint が飛ばす名前のソースのファイルが無い。Oxlint の設定は直下の `oxlint.config.ts` だけ(`bun run lint` は `--disable-nested-config` で入れ子の設定を読まない)。
- 守るべきルールが Oxlint の設定で `error` になっていて、`overrides` で弱めていない。lint とテストで、行数の境目がそろっている。

lint のルールは、書いているときにすぐ気づくための早めの知らせとして残す。

## 用語集の検査

`tooling/structure/` のテストが、`GLOSSARY.md` の「機械で探す語」に挙げた表記を、リポジトリの文書・コメント・文字列から探す。`glossary.ts` が用語集を読み、`prose.ts` がファイルから文を取り出し、`glossary-search.ts` が探す。コミットのメッセージからは、commit-msg の hook が探す(下の「コミットのときの検査」)。

- 探すのは、「機械で探す語」に挙げた表記だけ。避けたい語の多くは、別の概念を指す正しい文にも現れる(「データベース」の中の「ベース」、「DNS のレコード」「CSRF トークン」「イベントハンドラ」「消印」など)。文字だけでは意味を見分けられないので、ほかの意味ではまず使わない表記と、エージェントが書きがちな言い回し(「印を付け」「版を上げ」「指摘すること」)だけを挙げる。最初は広く探していて、Codex のレビューで巻き添えの多さが分かった。
- 本物の用語集が、別の概念を指す正しい文を落とさないことを、`repository.test.ts` で確かめる。広く使う語を「機械で探す語」に足すと、このテストが落ちる。
- 読むのは「機械で探す語」の表だけで、探す表記・代わりに書くもの・探す範囲を、その表が持つ。ほかの表は人が読むためのもので、書き方を自由に変えられる。最初は、ほかの表の「使わない表記」から代わりの表記を引いていた。そのために補足の括弧や「(同じ)」の書き方を決めて読む仕組みが要り、用語集を読みやすい形に変えられなかった。
- 用語集の表をそのまま読み、表記を足したり変えたりしても検査のコードは直さない。用語集を唯一の出どころにするため。
- 表の形が崩れると、検査が黙って語を読み落とす。そこで、「機械で探す語」の表が無いこと、表の外にある行、列の数が合わない行、空の代わりに書くもの、空の探す範囲を、誤りとして落とす。行の字下げは無視する。
- 探す場所は、Markdown(コードのブロックを除く)、ソースのコメントと文字列とテンプレートリテラルの本文(oxc-parser で取り出し、識別子は見ない)、JSON の文字列。`GLOSSARY.md` と `tooling/lint/fixtures/invalid/` は除く。構文を読めないソースは、黙って飛ばさずに落とす。CSS のクラス名や HTTP の値のような、文でない文字列も探す。今の「機械で探す語」は日本語の言い回しが中心で、そうした文字列には現れないため。英字の語を足すときは、文字列の使われ方で分けることを考える。
- コメントや文字列は、1つずつ探す。全部をつないでから探すと、テンプレートリテラルの区切りのバッククォートや、別々の文字列のかぎかっこが組になり、その間の語を見落とした。
- バッククォートの中(コードの名前。2本以上のバッククォートで囲んだものも含む)と、かぎかっこの中(語を引き合いに出しているところ。入れ子も含む)は探さない。閉じていないかぎかっこは、その行の終わりで閉じたものとする。
- 文字列は、ソースに書いたとおりの文字で探し、`\u6A5F` のようなエスケープは展開しない。行の番号を元のファイルとそろえるため。
- 日本語には単語の区切りが無いので、部分一致で探す。ほかの語の一部になっているところも数えるので、ほかの語の一部にもなる表記は挙げない。以前は、使ってよい語の一部になっているところ(「ビジネスイベント」の中の「イベント」)を数えない仕組みがあった。広く使う語を探すためのもので、探す語を絞ったので外した。
- 英字の語は、前後が英数字や `_` と続いているとき、または `-`・`.`・`/` を挟んで英数字と続いているときは数えない。ファイルの名前やパスは拾わず、文末の語は拾う。
- 改行は、LF・CRLF・CR・U+2028・U+2029 のどれも1つと数える(`source-file.ts` と同じ)。
- 単体テストは、本物の用語集に無い作り物の語で書く。テストのファイルも、この検査の対象になるため。

## ほかのリポジトリの名前の検査

`tooling/structure/` のテストが、手元だけの一覧(メインの checkout の `.private/other-repositories.txt`)から名前を読み、リポジトリの全ファイルのパスと中身から探す。コミットのときは、git の hook が、ステージしたファイルのパスと中身と、コミットのメッセージからも探す。`private-name-list.ts` が一覧の場所をたどって読み、`private-names.ts` が探す。

- 一覧はコミットしない。一覧そのものに、非公開のリポジトリの名前が入るため。そのため、一覧の無い環境(ほかの人の手元や、Codex の sandbox)では探さない。一覧を持つ手元で `bun run check` を流せば止まるので、割り切る。
- 一覧は、worktree ごとではなくメインの checkout に1つだけ置く。worktree から `git rev-parse --git-common-dir` でたどる。worktree を作るたびに一覧を写さずに済む。
- 探すのは、`git ls-files` の一覧(コミットしていないが無視もしていないファイルを含む)の全ファイル。文書やコメントに限らず、コードや設定も探す。名前や中身を書いてはいけない場所は、文の中に限らないため。用語集の検査と違って、バッククォートやかぎかっこの中も探し、`tooling/lint/fixtures/invalid/` も外さない。
- 大文字と小文字は区別しない。英字で始まる名前は、前が英数字のときは数えない。英字で終わる名前は、後ろが英数字のときは数えない(短い名前が、ほかの英単語の一部で見つからないように)。`-`・`.`・`/` や日本語と続いているときは数える(パスや文の中の名前も見つける)。日本語の名前は部分一致で探す。
- コミットのメッセージは、commit-msg の hook が探す。check はコミットの前に流すので、その時点でメッセージはまだ無い。

## フォルダの整理

`tooling/structure/` のテストが、リポジトリの全ファイル(`git ls-files` で一覧にしたもの)を見て検査する。フォルダの中身を数えるには全体を見る必要があり、1ファイルずつ見る lint には向かない。

- 1つのフォルダに置けるのは10件まで。`__tests__` と、`AGENTS.md`・`CLAUDE.md`・`DECISIONS.md`・`README.md` は数えない。リポジトリの直下と、`.` で始まるフォルダの中は検査しない(設定ファイルの置き場所がツールで決まっているため)。`.` で始まるフォルダも、親のフォルダでは1件と数える。
- フォルダの名前は kebab-case(`__tests__` は除く)。`__tests__` の中にフォルダは作れない。
- 一覧は `git ls-files -z` で取る。日本語のファイル名が引用符付きで返ってくるのを避けるため。作業ツリーから消したファイルは数えない。
- わざと約束を破る fixture を置く `tooling/lint/fixtures/invalid/` は、この検査から外す。
- drizzle-kit が migration を書き出す `apps/server/src/db/migrations/` と、その下のフォルダは、名前と数の検査から外す。drizzle-kit は migration を1件ごとに `20261121073110_create-notes/` のようなフォルダに書き、名前と数はこちらで変えられない。名前の先頭の日時が適用する順番を表すので、kebab-case にもそろえられず、migration は増える一方なので10件にも収まらない。外すのはこのフォルダの下だけで、親の `apps/server/src/db/` では、ほかと同じく1件と数える。
- 同じ理由で、migration のフォルダは oxfmt の整形からも外す(`.oxfmtrc.json` の `ignorePatterns`)。drizzle-kit が書く `snapshot.json` の配列の折り返しが oxfmt と違い、`bun run check` の整形の確認で落ちた(使い捨ての migration で確かめた)。生成物を整形し直すと、生成し直すたびに差分が出る。SQL と JSON は Oxlint の対象ではないので、lint の設定は変えない。
- 並べ替えでは `localeCompare` を使わない。テストを書いている途中で、`localeCompare` が実行環境のロケールで順番を変え、テストの期待と食い違った。文字コードの順で並べる。

## コミットのときの検査

コミットのときに、git の hook(`tooling/git-hooks/`)が、`bun run check` では確かめられないものを確かめる。

- pre-commit(と、merge のときの pre-merge-commit)は、ステージしたファイルのパスと中身から、ほかのリポジトリの名前を探す。名前の一覧は手元にしか無く、CI では探せないため。作業ツリーでなく、ステージした中身を読む。
- commit-msg は、commitlint でメッセージの形を確かめ、メッセージから、ほかのリポジトリの名前と、用語集の「機械で探す語」に挙げた表記を探す。メッセージは、check の時点ではまだ無い。PR では、CI も同じ検査を、PR のコミットのメッセージとタイトルに掛ける(下の「CI」)。
- 整形・lint・型検査・テスト(ファイルの中の「機械で探す語」の検索を含む)は、コミットのときには流さない。CI と役割が重なるため(ユーザーが決めた)。時間の問題ではない。測ったときは、ステージした32ファイルで、整形0.1秒・lint 0.4秒・型検査0.5〜0.8秒と速かった。

### hook の入れ方

git の `core.hooksPath` を、コミットしたフォルダ `tooling/git-hooks` にする。`bun install` が、直下の package.json の `prepare` で `install.ts` を流して設定する(Bun は install・add・remove のたびに `prepare` を流す。実測)。

- 相対パスの `core.hooksPath` は、hook を流す worktree の直下を起点に解決される(git 2.39 で実測)。設定は全 worktree が共有するが、どの worktree でも、その worktree のブランチにある hook が流れ、hook の無い古いブランチでは何も流れない。
- hook を入れるツールは使わない。依存が増えるうえに、どれも worktree と合わない。lefthook と simple-git-hooks は、全 worktree が共有する `.git/hooks` に hook を書くので、ある worktree で入れた hook が、ほかの worktree でも流れ、その worktree のブランチにある hook と食い違う。lefthook 2.2.2 が書く hook は、lefthook の実行ファイルが見つからないと、メッセージを出すだけでコミットを通す(手元で確かめた)。husky は、hook を置くフォルダが gitignore した生成物で、そのフォルダをまだ作っていない worktree では、黙って hook が流れない。
- `install.ts` は、パッケージの直下が git のリポジトリの直下のときだけ設定する。tarball をほかのリポジトリの中に展開したときに、そのリポジトリの設定を変えないため。

### コミットのメッセージの形

設定は直下の `commitlint.config.ts`。`@commitlint/config-conventional` を extends し、type と scope の一覧はこの設定にだけ書く。

- commitlint は、CLI のファイルを Bun で直接流す。bin の shebang は node で、`bun --bun run` は一時フォルダに `node` の symbolic link を作るので、書き込めない sandbox では Node で動いて失敗した(Codex の sandbox で確かめた)。
- config-conventional のルールのうち、日本語の件名に合わないものを変えた。
  - `subject-case` を外す。日本語の文字に大文字と小文字が無いので、英語の語で始まる件名(「README を直す」「Hono を入れる」など)を落とした。
  - `subject-full-stop` で止める文字を `。` にする。
  - `header-max-length`(文字の数で100)を外し、1行目を半角に換算して100文字までにするルール(`header-max-width`)を足す。文字の数で数えると、日本語だけの1行目は、英語の200文字分の幅まで通る。これまでのコミットの1行目は、一番長いもので半角に換算して83文字。
  - `body-max-line-length`・`footer-max-line-length` を外す。日本語の文は空白で区切らないので、決まった文字の数で折り返すと、語や文の途中に改行が入る。
  - `body-leading-blank`・`footer-leading-blank` を、warning から error にする。warning ではコミットが通ってしまうため。
  - 件名に日本語(ひらがな・カタカナ・漢字)を求めるルール(`subject-japanese`)を足す。
- 足したルールは `tooling/git-hooks/commit-rules.ts` に置き、幅の上限もルールの中に書く。commitlint のルールは `(parsed, when, value)` の3つの引数で呼ばれ、設定から値を受け取ると `max-params` に掛かるため。
- テストは、例のメッセージを CLI に渡して、通らなかったルールの名前を確かめる。`@commitlint/lint` を直接呼ぶと、parser の設定の型が `unknown` で、型のキャスト無しには渡せない。

### コミットのメッセージの中身

- commitlint のルールにはしない。commitlint は、merge・revert・`fixup!`・`amend!` のメッセージを、ルールを1つも流さずに通すが、ブランチの名前が入る merge のメッセージや、rebase で元のメッセージを置き換える `amend!` の本文も探したい。
- git が消すコメント(`core.commentChar` で始まる行)と、`git commit --verbose` の scissors の行から後(diff)を除いてから探す。コメントには消したファイルのパスが、diff には消した行が入るので、名前を消すためのコミットを止めないため。
- 「機械で探す語」は、探す範囲が「リポジトリ全体」の表記だけを探す。メッセージは、どのフォルダにも属さない。

## CI

GitHub Actions の workflow を、`.github/workflows/` に2つ置く。job の名前(`check`・`commit-messages`)は、main の ruleset で、通ることを必須にする check として登録した名前なので、変えるときは ruleset も直す。

- **`check`**(`check.yml`):PR と main への push で、`bun install --frozen-lockfile` と `bun run check` を流す。手元と同じ手順で、テスト用の PostgreSQL も `bun run check` が Docker Compose で起動する(直下の `DECISIONS.md` の「PostgreSQL の用意」)。
- **`commit-messages`**(`commit-messages.yml`):PR で、PR のコミットのメッセージと、PR のタイトルを確かめる。main は「Squash and merge」だけにする予定で、main に残るのはタイトルになるため。
- **workflow を分ける**:`commit-messages` は、PR のタイトルを直したとき(`edited`)にも流す必要がある。`check` を同じ workflow に置くと、タイトルや本文を直すたびに `check` も流れる。job の `if` で `check` を飛ばすと、飛ばした job は通ったものとして扱われ、落ちていた `check` が、タイトルを直しただけで通ったことになる。同じ理由で、本文だけを直したときも `commit-messages` を飛ばさない。

### メッセージの検査

- **同じ検査を2か所に書かない**:`tooling/ci/check-pull-request-messages.ts` は、メッセージを1件ずつ一時ファイルに書き、commit-msg の hook のスクリプト(`tooling/git-hooks/commit-msg.ts`)にそのまま渡す。hook の検査を変えれば、CI の検査も変わる。`#` で始まる行の扱いも hook と同じになる。
- **範囲は PR のコミットだけ**:`git rev-list` で、`pull_request` イベントが渡す base の SHA から head の SHA までをたどる。main に入ったコミットは、入るときに確かめてある。検査を厳しくしても、過去のコミットで PR が落ちないようにするため。履歴をたどるので、checkout は `fetch-depth: 0` にする。
- **PR のタイトルは、main に残る1行目として確かめる**:「Squash and merge」は、タイトルの後ろに ` (#番号)` を足して1行目にする。確かめるのは番号を足した1行目なので、半角に換算した幅は番号まで含めて数える。
- **PR の本文は確かめない**:main に残るのはタイトルだけにする前提(squash のコミットのメッセージを、PR のタイトルだけにする設定)。本文も main に残す設定にするなら、本文も確かめる。
- **タイトルは環境変数と標準入力で渡す**:`${{ }}` で `run` に直接書くと、タイトルがシェルのスクリプトの一部として展開され、タイトルに書いたコマンドが流れる(script injection)。引数でなく標準入力で渡すのは、`-` で始まるタイトルを option と読ませないため。
- **ほかのリポジトリの名前は探さない**:CI には名前の一覧が無い(一覧は手元にだけ置くため)。名前は、手元の `bun run check` とコミットのときの hook が探す。

### 守りの設定

- **`permissions` は `contents: read` だけ**:どちらの job も、リポジトリを読むだけで何も書かない。既定の権限はリポジトリの設定で決まり、書き込みを含む設定にもできる。最上位で決めていることを、`tooling/structure/` のテストが確かめる。
- **checkout の `persist-credentials: false`**:token を `.git/config` に残さない。後の step(依存の install で流れる script を含む)から token を読めないようにする。
- **actions はコミットの SHA で固定する**:タグは付け替えられるので、同じタグでも別のコードが流れうる。SHA だけでは何のバージョンか読めないので、行末のコメントにバージョンを書く(設定ファイルにコメントを書かない約束の例外。直下の `DECISIONS.md`)。形は `tooling/structure/` のテストが確かめる。上げるときは、SHA とコメントを一緒に直す。
- **`concurrency`**:PR は番号ごとにまとめ、新しい実行が古い実行を止める。main への push の実行は SHA ごとに分け、新しい実行で古い実行を止めない。main のどのコミットにも結果を残すため。
- **runner を `ubuntu-26.04` に固定する**:`ubuntu-latest` は GitHub が切り替えるので、Docker や Compose のバージョンが知らないうちに変わる。
- **`timeout-minutes`**:既定の6時間は長すぎる。`check` は15分、`commit-messages` は5分にする。
- **依存を cache しない**:`bun install` は CI で1秒かからない(810ms。実測)。cache の action を足すほどではない。

## 割り切ったこと

- **エディタの設定の読み直し**:エディタの Oxlint(LSP)は `oxlint.config.ts` だけを見張り、`tooling/lint/config/` のモジュールを直しても、読み直さない(Node のモジュールのキャッシュに残る)。CLI と CI は毎回新しいプロセスで読むので、困るのは開いているエディタだけ。設定を直したら、エディタで `Oxc: Restart oxlint Server` を流す。見張る範囲は Oxlint の側でしか変えられない。
- **TSDoc の言い回しの検査**:`tsdoc-role-only` は条件・例・補足・理由の言い回しを正規表現で見るので、すり抜けも誤検知もある。文の意味を読むには、日本語の構文の解析が要る。すり抜けはセルフレビューで見て、誤検知は言い回しを外して直す。
- **字下げのコードのブロック**:用語集の検査は、Markdown の、4つの空白で字下げしたコードのブロックを扱わない。コードはフェンスで書くので、受け入れる。
- **`Promise.allSettled`・`Promise.any`**:どちらも失敗を値に変えられるが、`no-catch-outside-entry` は止めていない。結果の型に失敗が出るので、握りつぶしがコードから見える。使う場面が出たら、止めるかを決める。
- **`import()` のほかの読み込み**:`no-dynamic-import` は `import()` だけを止める。`import.meta.require` や `node:module` の `createRequire` を使えば、境界の外のモジュールを読み込めるが、普通は書かない形なので止めていない。
- **`-m` で書いたメッセージの `#` の行**:git は、エディタを開かないとき(`-m`・`-F`)はコメントを消さないが、commit-msg の検査は `#` で始まる行を読まない。エディタで書いたときの git のコメントと見分けられないため。commitlint も同じ扱いをする。`core.commentChar` を `auto` にしたときも、`#` として扱う。どちらも、普通の使い方では起きないので受け入れる。
- **commitlint の既定の除外**:commitlint は、本文のどこかに `Merge branch …` のような行があるメッセージや、`1.2.3` だけのメッセージを、形を確かめずに通す。普通のメッセージには現れず、通っても、名前と「機械で探す語」の検索は流れるので、受け入れる。
- **既にある hook**:`install.ts` は、ほかの `core.hooksPath` があれば置き換える(前の値を出す)。そのため、`.git/hooks` の hook も流れなくなる。このリポジトリでは、ほかの hook を使っていない。
- **submodule**:pre-commit は、ステージした submodule の中身を読めずに失敗し、コミットを止める。このリポジトリでは submodule を使っていない。
- **PATH に Bun が無い環境**:hook は `bun` を PATH から探すので、PATH を引き継がない GUI の git クライアントなどでは、hook が失敗してコミットできない。黙って通すより安全なので受け入れる。
- **PR のタイトルの句点**:確かめるのは ` (#番号)` を足した1行目なので、タイトルを `。` で終えても `subject-full-stop` では止まらない。main の1行目は番号で終わり、句点では終わらないので受け入れる。
- **hook を通らないメッセージの中の名前**:PR のタイトルと、GitHub の画面で作ったコミット(レビューの提案の取り込みなど)のメッセージは、手元の hook を通らない。CI にも名前の一覧が無いので、ほかのリポジトリの名前は誰も探さない。一覧を CI に渡すと、一覧そのものを GitHub に預けることになり、見つけた名前も公開のログに出る。タイトルは人が書いてレビューで見るので、受け入れる。
