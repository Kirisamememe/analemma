# 決めたことと理由(tooling)

## lint の設定

設定は直下の `oxlint.config.ts`。型付きのルールは fixture では確かめられない(fixture は型を使わずに検査する)。

- 編集用 Dialog の左右の余白は `px-panel` でヘッダー・本文・フッターをそろえる。部品で padding を指定する箇所だけに許し、数値の目盛りと上下の margin の制限を保つ。縮小したタイトル用の `lg/2xl` はほかの文字の役割と同様、`ui/typography.ts` だけで許す。
- **設定を TypeScript で組み立てる**:設定は1つの JSON ではなく、`oxlint.config.ts` が `tooling/lint/config/` のモジュール(組み込みのルール・自作のルール・ワークスペースごとの `overrides`・server の `overrides`・API の制限の部品)を組み立てる。Oxlint の `overrides` は、同じルールを書くと前の options を丸ごと置き換えるので、場所ごとに少しずつ違う制限(Bun・Node・Drizzle・oRPC の builder の import の禁止など)を、JSON では毎回全部書き写していた。部品にすれば1か所から組み立てられ、写し間違いが起きない。管理画面の Tailwind CSS の class の検査も、場所ごとに違う制限を同じ部品から組み立てる(デザインシステムのレビューで決めた)。`defineConfig` の型で、Oxlint が型を持つ組み込みのルールの options は型検査に掛かる(JS のプラグインのルールの名前と options は、型が `unknown` なので掛からない)。
- 移したときに、組み立てた設定が、前の `.oxlintrc.json` と同じ値になることを確かめた(違いは、`$schema` を消したことと、下の `import/extensions` の `overrides` を足したことだけ)。
- 設定のファイルは、Oxlint が Node の `import()` で読む。Node は TypeScript を type stripping で読むだけで、拡張子の無い相対 import を解決しないので、設定のファイル(`oxlint.config.ts`・`oxlint.fixtures.config.ts`・`tooling/lint/config/`)の相対 import には `.ts` を付ける(fixture は `tooling/lint/fixtures/{valid,invalid}/tooling/lint/config/`)。`import/extensions` も、そこでだけ `.ts` を求める(`tooling/lint/**/*.mjs` に `.mjs` を求めるのと同じ理由)。`overrides` は options を丸ごと置き換えるので、`.json`・`.mjs` などの決まりも同じ部品から書き足す。TypeScript の設定のファイルを読むには、型消去を既定で使う Node が要る(README の「開発」。CI の runner には Node 24 が入っている)。
- fixture のテストは、Oxlint が設定を読めずに JSON の結果を出さなかったときに、Oxlint の出力をそのまま失敗の文言に入れる。Node が古いと、JSON を読めないという失敗だけが出て、原因が分からなかった。
- 1つのファイルのコードは400行までなので、ルールの一覧も、組み込みのプラグインのルール(`core-rules.ts`)と、自作と JS のプラグインのルール(`project-rules.ts`)に分ける。

- 複数行の `const` と `export const` は前後の文との境目を見つけにくいので、`stylistic/padding-line-between-statements` で前後に空行を求める。1行の宣言同士は続けて書ける。

- **自作のルール**(`tooling/lint/rules/`)
  - `no-standalone-comment`:単独の行のコメントとブロックコメントを禁止し、行末のコメントは40文字までにする。lint への指示(`oxlint-disable` など)と `@ts-expect-error` は除く。TSDoc は宣言・型のプロパティ・メンバーの直前にだけ書ける。分割の見出し(10本以上の `-` の罫線・見出しの行・罫線の3行)は、コードが200行を超えるファイルでだけ許し、400行を超えるファイルには1つ以上を求める。行数は、空行とコメントだけの行を除いて数える(`eslint/max-lines` の `skipBlankLines`・`skipComments` と同じ数え方)。見出しの行は、文字か数字を含み、lint への指示ではないものに限り、40文字までにする。必須の条件を満たすのは、後ろにコードが続く見出しだけ(ファイルの末尾に置いただけの見出しは数えない)。改行は LF・CRLF・CR・U+2028・U+2029 のどれでも1行と数える。TSDoc と宣言のあいだに見出しを挟むと、宣言の直前に無い TSDoc の診断を出す。
  - `tsdoc-role-only`:TSDoc の説明とタグを、それぞれ1行・1文・60文字までにし、条件・例・補足・理由の言い回しと、`@param`・`@returns`・`@deprecated` 以外のタグを禁止する。言い回しは正規表現で見る(「割り切ったこと」)。「起動時に組み立てる」のような定義まで止めていたので、「時に」「ときに」は条件の言い回しから外した。`test.if` のようなコードの名前で引っかからないよう、バッククォートで囲んだ部分は言い回しの検査から外す。
  - `no-markup-test`:テストで、test id による検索、DOM のたどり方(`querySelector` など)、クラス名や HTML の中身、スナップショットを禁止する。
  - `max-code-lines`・`file-length-limit`:ファイルのコードの行数(空行とコメントだけの行を除く)に上限を設ける。同じ実装を、400行(`max-code-lines`。1行目に理由付きで抑制できる)と800行(`file-length-limit`。抑制できない)の2つの名前で使う。Oxlint の `eslint/max-lines` は、複数行のコメントや CR だけの改行で数え方が食い違ったので使わない。
  - `require-disable-reason`:lint の抑制に、ルールの名前と `--` の後の理由を求める。ルールの名前と説明の区切りは、Oxlint と同じ読み方にする(カンマと空白で区切り、`--` か前後に空白のある `-` から説明が始まる。`/` の無い名前はプラグイン名を除いた部分で照らし合わせる)。抑制できないルール(`file-length-limit`・`no-standalone-comment`・このルール自身)の抑制を止め、`max-code-lines` の抑制は1行目の `// oxlint-disable` の形だけを許す。
  - `no-focused-test`:`test.only`・`describe.skip`・`test.todo`・`test.if` などを禁止する。
  - `no-cross-workspace-import`:相対パスと server・管理画面の `@/` が自分のワークスペース(`apps/<名前>`・`packages/<名前>`)の外を指す import と re-export を止める。Bun の isolated linker が依存を制限するのはパッケージ名での import なので、ファイルを直接指すパスはこのルールで検査する。
  - `require-sibling-test`:管理画面の `src/` の `.ts` が関数(hook を含む)を export するなら、同じフォルダの `__tests__` にテストを求める。表示を出し分ける `.tsx`(JSX を返す条件分岐がある)にも、`__tests__` にテストを求める。テストのファイルは、`.test.ts` と `.test.tsx` のどちらでも数える(テストの拡張子は、テストに JSX があるかで決まる)。テストのファイルは、中に `test(` か `it(` があるときだけ数える。lint を通すためだけの空のファイルやフォルダでは通らない。`.storybook/` には掛けない。管理画面のテストは `src/` から流す(`apps/admin/bunfig.toml` の `root`)ので、`.storybook/__tests__` に置いても流れない。`.storybook/` の `useHtmlPreferences` は、全部の story を描くテスト(`src/__tests__/stories.test.tsx`)が、html の `lang` と `data-theme` で確かめる。
  - `require-jsx-in-tsx`:JSX の要素も fragment も含まない `.tsx` を止める。リポジトリの全体(テスト・story・`.storybook/`・fixture を含む)に掛ける。理由は `apps/admin/DECISIONS.md` の「`.ts` と `.tsx`」。
  - `no-react-in-logic`:管理画面の `src/` の `.ts`(テストと story を含む)で、React(`react`・`react-dom` とそのサブパス)の値の import と re-export を、hook のファイルと context のファイルにだけ許す。どちらのファイルかは、ファイルの名前と、export するものの形で決める(`apps/admin/DECISIONS.md` の「`.ts` と `.tsx`」)。hook の名前は、export する名前で見る(`export { a as useA }` も hook)。`export { … } from` で、ほかのモジュールから re-export する値は、関数かどうかを読めないので、関数と数える。import してから別の文で export する値は、関数と数えない(hook のファイルで React の関数を export し直すことは、わざとしない限り起きない)。`createContext` は、React から import した名前(別名を含む)と、React の default と namespace の import から呼んだものを数える。context のファイルは、`createContext` の結果を1つ以上 export する。`no-restricted-imports` は、ファイルの名前や export の形を見られないので、自作のルールにした。`.storybook/` は `src/` の外で、Storybook の設定と枠を置く場所なので掛けない。
  - `admin-module-location`:管理画面の `features/`・`components/`・`ui/`(テストと story を除く)で、hook を `hooks/` の外に、関数を export する `.ts` を `logic/` と `queries/` の外に置かせない。`features/` では、server の API を呼ぶ処理も `queries/` の外に置かせない。理由は `apps/admin/DECISIONS.md` の「hook・純粋な関数・server の API を呼ぶ処理の置き場所」。hook は、export する名前が `use` で始まる関数と、分割代入で受けて export する `use` で始まる名前(TanStack Form の `createFormHook` の結果など。宣言に `export` を付けても、別の文の `export { … }` でも)で見る。ほかのファイルからの re-export は、hook を置いたファイルの側で見るので、見ない。server の API を呼ぶかは、`api` という名前の変数・分割代入で `api` から受けた変数・`ApiClient` の型を付けた変数から、`admin`・`auth`・`deploy`・`public` を読む式と、それらを分割代入で取り出す書き方(`{ api: { admin } }` のような入れ子も)で見る。純粋な関数でも server の API を呼ぶ処理でもない `.ts`(ブラウザの API を呼ぶ、呼び出しのあいだ状態を持つ、渡された関数で外に書き込む、`crypto.randomUUID()` で値を作る、など)は、設定の `effectfulModules` にパスを書いて外す。フォルダの名前が置き場所の約束なので、名前を見るだけでよい。`no-restricted-imports` ではファイルの置き場所と export の形を照らし合わせられないので、自作のルールにした。
  - `test-location`:テストのファイルを `__tests__` の直下に置かせ、`__tests__` にはテストのファイルだけを置かせ、`__tests__` の中にフォルダを作らせない。テストがテストするコードと同じフォルダにあるかまでは見ない(API 越しのテストは、1つのファイルに対応しないため)。
  - `max-exported-functions`:コードの行数(空行とコメントだけの行を除く)が200行を超えるファイルは、export できる関数を2つまでにする(型は数えない)。200行以下なら、数は問わない(ユーザーが決めた。理由は直下の `DECISIONS.md` の「ファイルの長さ」)。境目の200行は、分割の見出しを使える行数と同じ値を、`tooling/lint/config/project-rules.ts` の1か所から渡す。数えるのは、arrow function・function 宣言・function 式だけで、呼び出しの結果(oRPC の procedure や、関数を返す関数の戻り値)は数えない。server の「1ファイルに、1つの procedure か1つの関数」のうち、この上限で抑えるのは関数の数だけで、procedure の数は抑えない。
  - `no-inline-parameter-type`:関数の引数に、インラインのオブジェクト型を書かせず、名前付きの型にさせる。
  - `no-catch-outside-entry`:try/catch の catch 節と、`.catch()` の呼び出しを禁止する(server だけ)。想定外の失敗は throw して入口でログにする約束で(HTTP の入口は 500 を返し、リクエストの外で流す処理は1件ごとの進み具合に書く)、これまで lint で止めていなかったので、WebCrypto の鍵の読み込みの `.catch(() => undefined)` が約束をすり抜けていた。`finally` だけの try は、後始末のために許す。`.then(a, b)` の2つ目の引数は、`promise/prefer-catch` が `.catch()` に書き直させるので、ここで止まる。
    - 入口と dispatcher では、Oxlint の設定の `overrides` でこのルールを外す。入口に数えるのは、HTTP の入口(`src/app.ts`)、コマンドの入口(`src/main.ts`・`src/enroll.ts`・`src/db/migrate.ts`)、起動のときの環境変数の検証(`src/platform/startup/parse-database-url.ts`)、リクエストの外で写真を1枚ずつ取り込む処理(`src/features/dropbox/importing/run-dropbox-import.ts`)、リクエストの外で受け取った写真を変換する処理(`src/features/images/creating/run-pending-conversion.ts`)。環境変数の検証は、起動の入口で外からの値をデコードする場所なので入口に数える。`.env` のパスワードの `%` のような、人が普通にする書き間違いを、パスワードを出さない決まった文言で知らせるため、`decodeURIComponent` の失敗を受け止める。dispatcher(ビジネスイベントを配る場所)は、作るときに足す。Dropbox からの取り込みは、受けたリクエストの応答を待たずに server のプロセスで進むので、1枚の想定外の失敗を受け止めてログに書き、次の写真へ進む場所が要る。HTTP の入口と同じ役割なので、入口に数える。
    - テストのファイルと、テストの部品(`src/test-client/`・`src/platform/test-database/`)でも外す。テストは失敗を値として受け取って確かめるので、握りつぶしではない。本番のコードは、この2つのフォルダを import できない(`tooling/structure/` のテストが止める)。import できると、`catchErrorCode` のような部品を通して、このルールをすり抜けられる。
  - `styling-boundary`:管理画面の見た目の境界を守る(デザインシステムの判断は `apps/admin/src/ui/DECISIONS.md`)。画面のコード(`ui/` の外)では、`style` と、文字列のリテラルでない `className`(と `…ClassName`)を止める。式を渡すと、class の検査(eslint-plugin-better-tailwindcss)が中身を読めず、すり抜けるため。`ui/` の中では、`className` を、リテラル・関数の呼び出し・呼び出しを返す関数(React Aria Components の render props)に限り、`style` にその場で書いたオブジェクトだけを許して、キーを `--` で始まる CSS 変数に限る。どちらでも、JSX の props の spread を止める(spread で渡した `className` や `style` は検査が見ない)。
  - `max-classes-per-string`:`ui/` と `features/*/ui/` で、class を書く文字列(JSX の `className` と `…ClassName` の属性、`tv`・`merge` の呼び出しの中、`class`・`className` のプロパティ、名前が `ClassName(s)` で終わる変数)の1つに、9個以上の class を書くと止める(上限はユーザーが決めた8個)。理由は `apps/admin/src/ui/DECISIONS.md` の「検査」。空白で区切って数える。テンプレートリテラルでは、補間を空文字としても9個以上になる場合に止める。class を選ぶ条件の比較文字列は数えない。eslint-plugin-better-tailwindcss の `enforce-consistent-line-wrapping` は、行の幅で折り返させるルールで、整形と食い違うので使わない(下の「管理画面の Tailwind CSS の class の検査」)。class の数で区切れば、整形とぶつからない。JSX の `className` の文字列は、配列にできないので、文言で `tv` に移すように伝える。
  - `no-dynamic-import`:`import()` による動的な import を禁止する。境界を守る `no-restricted-imports` は動的な import を見ないので、`import()` なら Drizzle や Bun の API を、決めた場所の外から読めてしまう。今のコードでは、client の CLI の入口(`packages/client/src/cli/main.ts`)の1か所だけで、理由付きで抑制している(利用者の定義のファイルは、実行するときにしかパスが分からない)。
  - `no-effect-outside-allowed-hook`:React の `useEffect`・`useLayoutEffect`・`useInsertionEffect` を、一覧に載せた hook の直下でだけ呼べるようにする。React の外と同期する処理の目的を hook の名前で示し、effect が必要な場所を一覧で把握するため。React からの import を参照する呼び出しを見て、直接囲む関数の名前を `allowedHooks` と照らし合わせる。管理画面全体(`src/` のテスト・story と `.storybook/` を含む)に掛ける設定と hook の一覧は、管理画面の層の境界と同じ `tooling/lint/config/admin-overrides.ts` に置く。effect を使う判断は `apps/admin/DECISIONS.md` の「React の effect」に書く。
- **管理画面の層の境界**(`tooling/lint/config/admin-overrides.ts`):React Aria Components とその下の層と lucide-react を import できるのは `ui/primitives/` だけ、`tailwind-variants` を import できるのは `ui/tv.ts` だけ(どれもサブパスを含む)。`ui/layout/` から primitives と patterns へ、`ui/primitives/` から patterns への import は、相対パスと `@/` のどちらでも止める。理由は `apps/admin/src/ui/DECISIONS.md` の「部品の層」。場所ごとに `no-restricted-imports` の options が違うので、Bun・Node・React の制限と同じ部品から、場所ごとに組み立てる。
- **管理画面の Tailwind CSS の class の検査**(eslint-plugin-better-tailwindcss を、Oxlint の JS のプラグインで動かす。設定は `tooling/lint/config/admin-classes.ts`)
  - border・divide・outline の class は、線で伝える情報が決まっている部品で、必要な辺・状態・色だけを許す。検査の対象と許可する class は `admin-borders.ts` に置き、装飾の線を追加した fixture がエラーになることを確かめる。診断の文言には、線を限る理由と、代わりに使う utility(`separator-*`・`edge-outer`)を書く。理由の無い文言では、許可表に class を足すことが直し方に見える。CSS に直接書いた宣言や `@apply` は、管理画面のテストで PostCSS の構文木から検査し、区切りと縁の utility の宣言は、決めた色と幅だけを通す。判断の基準は `apps/admin/src/ui/DECISIONS.md` の「枠と面の境界」にある。
  - 管理画面の `src/` にだけプラグインを読み込む(`overrides` の `jsPlugins`)。server などのファイルで、Tailwind CSS の設定を読む時間を使わない。プラグインの設定(`settings`)は `overrides` に書けないので、直下に書く。`cwd` を `apps/admin` にし、`entryPoint` に管理画面の `src/ui/app.css` を渡す。`app.css` が読む `theme.css` と `animation.css` を含めた設定で、生成できない class を落とす。
  - 使うルールは、無い class・止める class・効き目がぶつかる class・重なった class・古い class・余分な空白・canonical な class(`enforce-canonical-classes`)・class の並び。行の折り返しは整形と食い違うので使わない。
  - 止める class は、場所ごとに違う(画面のコード、`ui/` と `features/*/ui/`、入力を受ける部品の枠の色 `line-strong` を書ける `ui/primitives/`、文字の役割を決める `ui/typography.ts`)。`overrides` は同じルールの options を丸ごと置き換えるので、止める形を部品にして、場所ごとの一覧を組み立てる(「設定を TypeScript で組み立てる」)。何を止めるかと理由は `apps/admin/src/ui/DECISIONS.md` にある。
  - selectors は、プラグインの既定から、class と関係の無い変数の名前(`style`・`styles`・`classes`)を除き、名前が `ClassName` で終わる属性と変数(`contentClassName` など)と、`ui/tv.ts` の `merge` の呼び出しを足す。既定のままだと、`Intl.NumberFormat` に渡す `const style = "currency"` まで class として止めた。
  - theme.css の色にどれも使ってよい utility を決めてあることと、文字の役割の組が theme.css の目盛りの名前であることを、テスト(`tooling/lint/__tests__/styles.test.ts`)で確かめる。色を足したときに、決まりを書き忘れると落ちる。
  - Storybook の story(`__stories__`)は、`ui/` の中にあっても、画面のコードと同じ決まりで検査する。`ui/` の決まりは部品を作るためのもので、story は部品を組んで見せるだけなので、色や class を選ばせない。story で決まりから外れたくなったら、部品を足すことになる。
  - パネルの両端の余白とスクロール領域の CSS 変数の用途は、`apps/admin/src/ui/DECISIONS.md` の「検査」に従う。
  - 余白の検査では、`gap-x`・`gap-y` もそれぞれ1つの utility として値を読む。`gap` の後をすべて値にすると、許可している `gap-x-3` でも `x-3` が目盛りに無いとして止まる。色の検査では `whitespace-*` を除く。これは空白をどう表示するかの class で、`whitespace-pre-line` の `line` は色の名前を指していない。
  - 色の見本(`ui/specimens/color-specimen.tsx`)だけ、色ごとに使える utility の決まりと、`line-strong` を `ui/primitives/` の外で止める決まりを外す。色の見本は、どの色も `bg-` で塗って並べる必要がある(`focus` や `line` は、ふだん `bg-` に使えない)。ほかの決まり(任意の値・不透明度・文字の役割など)は外さない。
  - story の import の決まりは、置いた層(primitives・layout)の決まりでなく、画面のコードと同じにする(React Aria Components を直に使えず、ほかの層の部品は使える)。story は描くだけなので、`require-sibling-test` も外す(全部の story を描くテストがある)。
- **Storybook の設定のファイル**(`apps/admin/.storybook/`):`main.ts` は Storybook が Node で読むので、相対 import に `.ts` を付ける(oxlint の設定と同じく、`import/extensions` を変える)。`.storybook/` の中は、型付きの lint が tsconfig の `noPropertyAccessFromIndexSignature` を読まないように振る舞う(`dataset["x"]` を `dot-notation` が止め、`dataset.x` を tsc が止める。`no-floating-promises` などのほかの型付きのルールは効く)。TypeScript の方を取り、ぶつかる `use-html-preferences.ts` だけ `dot-notation` を外す。`setAttribute("data-theme", …)` で書くと、こんどは `unicorn/prefer-dom-node-dataset` が止める。tsrs の振る舞いなので、tsrs を上げたら、外したままでよいかを見直す。
- **TSDoc のタグの検査**(eslint-plugin-jsdoc):`@param` の名前が引数と合うこと(`check-param-names`)、1つでも書いたら全部の引数に書くこと(`require-param`)、何も返さない関数に `@returns` を書かないこと(`require-returns-check`)、タグに型を書かないこと(`no-types`。型は TypeScript が持つ)。
- **使える API の制限**
  - `node:*` と Bun 専用のモジュールは、contract・client・管理画面で import できない。Node と Bun のグローバルも、server と tooling だけで有効にする。目的は、ブラウザ(や Node でないところ)でも動かすコードに、Node や Bun でしか動かない API を入れさせないこと。`node:fs/promises` のようなサブパスも止める(`node:*` だけではサブパスが pattern をすり抜けた。本番のコードでは、管理画面も contract と client の SDK も、Node の型を持たない tsconfig で tsc が止める)。
  - 管理画面のテスト(`src/**/__tests__/`)では、Node と Bun の import とグローバルを許す。テストは Bun で動くので、上の目的に当たらない(theme.css を読むテストなど)。
  - 管理画面の `.ts` で React の値を import できるのは、hook のファイルと context のファイルだけ(`no-react-in-logic`)。こうすると、ロジックを React なしでテストできる。拡張子は JSX の有無で決めるので(`require-jsx-in-tsx`)、JSX を書かない hook や context も `.ts` に置く。
  - `console`(ログは context で渡す logger を使う)、`process.env`(環境変数は起動時に検証する1か所だけで読む)、引数のプロパティの書き換えを禁止する。
- **足したルール**:`no-unnecessary-condition`(要らない `?.` や条件)、`no-abusive-eslint-disable`(ルールを指定しない抑制)、React の `only-export-components`・`no-danger`・`button-has-type`。
- **React の書き方をそろえるルール**(ユーザーが決めた。厳しめに):`restriction` と `style` の category は有効にしていないので、React のルールを名前で足す。
  - 書き方:`function-component-definition`(arrow function)・`prefer-function-component`(class で書かない)・`jsx-boolean-value`・`jsx-curly-brace-presence`・`jsx-fragments`・`jsx-pascal-case`・`self-closing-comp`・`jsx-filename-extension`(`.tsx` だけ)。
  - 誤りを防ぐ:`no-unknown-property`・`no-clone-element`・`no-react-children`(`Children` と `cloneElement` は、子の形に頼る壊れやすい部品を作る)。
  - 深さ:`jsx-max-depth` は 6。今の最大が 6 で、5 にすると14か所、4 にすると37か所が当たる。深い JSX は部品に分ける合図なので、下げるかはユーザーと決める。
  - 文言:`jsx-no-literals` を管理画面の `.tsx` に掛け、訳を通さない文言を JSX に直接書けなくする。JSX の子と、文言を受け取る属性(`aria-label`・`alt`・`title`・`label`・`placeholder` など。`TRANSLATED_ATTRIBUTES`)を見る。空の `alt` は通す。story・テスト・`src/testing/` では外す。
  - React Compiler の診断:`invariant`・`syntax`・`todo`・`unsupported-syntax`・`rule-suppression`。コンパイラが扱えない書き方を止める。
  - 足さなかったもの:`react-perf` の4つ(JSX の props に、その場で作った関数・オブジェクト・配列・JSX を渡さない)は、製品のコードで168か所が当たり、どの handler も `useCallback` で包むことになる。再レンダリングは、フォルダごとの「再レンダリングの期待」とそのテストで確かめる。`hook-use-state` は、setter を使わない `const [store] = useState(create)`(1回だけ作る値)も止めるので足さない。`jsx-handler-names` は、handler の名前を `handle…` に限り、hook が返す操作の名前(`retry`・`finish`)と合わない。`jsx-props-no-spreading` と `forbid-*` は、`project/styling-boundary` が同じことをより狭く止めている。class の中身のルール(`no-set-state` など)は、class を書けないので要らない。
  - fixture で確かめるのは、書き方・誤り・深さ・文言の11個。React Compiler の診断と、`jsx-pascal-case`・`jsx-filename-extension` は fixture を置いていない。
- **1ファイルに component を1つ**(`react/no-multi-comp`。ユーザーが決めた):`restriction` の category は有効にしていないので、名前を書いて足す。export しない補助の component も数える。`max-exported-functions` は、コードが200行以下のファイルを数えないので、`.tsx` に component を幾つでも並べられた。管理画面のフォルダを、片付けの済んだ順に `SINGLE_COMPONENT_FILES`(`tooling/lint/config/admin-overrides.ts`)に足し、最後は管理画面の全体に掛ける。story とテストは、見せるためや確かめるための包む component を同じファイルに書くので外す。
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
  - Drizzle と DB のドライバを値として import できるのは、`*.query.ts`・`src/db/`・`src/platform/` だけ。`src/features/` の外では、型だけの import も許す。feature には下の制限を掛ける。
  - Bun 専用の API(`Bun` と `HTMLRewriter` のグローバル、`globalThis.Bun`、`bun` と `bun:*` のモジュール、`hono/bun`)を使えるのは、`src/platform/` と `src/main.ts` だけ。`bun:test` はテストに使う。feature ではテストのファイルだけに許す。
  - 素の oRPC の builder(`implement`・`os`・`Builder`)を値として使えるのは、`src/procedures.ts` と `src/router.ts` だけ。feature の外では型だけの import も許す。
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
- **fixture をまとめて lint する**:全部の fixture を1回の Oxlint で lint し、テストは、その結果から対象のパスの診断を取り出す。対象ごとに Oxlint を起動すると、JS plugin の読み込みと、管理画面の fixture での Tailwind CSS の design system の組み立てを毎回やり直し、fixture のテストに約53秒かかった(まとめると約2秒)。
  - まとめても、対象ごとの結果は変わらない。ファイルをまたぐルール(`import/no-cycle` など)は、lint する一覧に無いファイルもディスクから読み、自作のルールは、ファイルをまたぐ状態を持たない。全部の対象で、対象ごとに lint した結果と比べて確かめた。本番の `bun run lint` も、1回でまとめて lint する。
  - 対象の終了コードは、対象に診断が1件でもあれば失敗とする。ルールの ID の無い診断(使っていない抑制のコメントなど)も数える。fixture の設定は警告も失敗にし、使っていない抑制をエラーにするので、対象だけを lint したときの終了コードと同じになる。
  - 対象のパスが無ければ、テストを失敗させる。まとめた結果を絞り込む形では、打ち間違えたパスが空の結果を返し、診断を出さないことを確かめるテストが、空のまま通ってしまうため。
  - 手元の check で、lint に関わるファイルに触れていない変更のときに fixture のテストを飛ばすことはしない(ユーザーが決めた)。約2秒なので、飛ばす仕組みに見合わない。
- **fixture**:ルールの分類ごとのフォルダ(`comments/`(TSDoc は `comments/tsdoc/`)・`jsdoc/`・`functions/`・`imports/`・`syntax/`・`tests/`)に分け、server や管理画面だけに掛かるルールの fixture は、`apps/server/src/` のように同じパスを再現したフォルダに置く。`tooling/lint/fixtures/` は `bun test` の対象から外す(`bunfig.toml` の `pathIgnorePatterns`)。描画するライブラリを import する fixture など、実行できないものを置くため。

### 管理画面の feature の import

feature が使う外のライブラリは `src/i18n/` と `src/api/` のモジュールに集める。
ライブラリを差し替えるときに調べて直す場所を限るため、feature に渡す形は今使うものに絞る。
差し替えへの備えは、抽象化の層を増やさず、依存する場所を限ることで担保する。

`eslint/no-restricted-imports` の否定の pattern で、`@analemma/contract`・管理画面内の相対パスと `@/`・`react` を通す。`!react` は `@storybook/react` のように最後の path segment が `react` の import にも一致するので、`*/**/react` でその例外を取り消す。
既存のルールで書けるので、自作のルールは足さない。
features の import には、この pattern を使う。React Aria Components・lucide-react・tailwind-variants・Node・Bun の import も `**` が止めるため、同じ import への診断は1件で済む。
テストと story は、描画や作り物の server の組み立てに外のライブラリを使える。
この制限は `src/features/` の製品のコードに掛ける。`src/routes/` は今回の適用範囲から外す。

### 管理画面で共有する部品の import

`src/components/` の製品のコードが `src/features/` を import したり再 export したりすると、複数の feature で使う部品が特定の feature に依存する。UI の層と同じ `eslint/no-restricted-imports` の設定で、相対パスと `@/` の両方を検査する。

### server の feature の import

`src/features/` では、server 内への相対パスと `@/`、それに `@analemma/contract` を許す。管理画面と同じ `no-restricted-imports` の pattern で、許していないモジュールは型だけの import も含め、import ごとに1件の診断を出す。相対パスと `@/` が server の外を指していないかは、ワークスペースの境界のルールが確かめる。

用途ごとの `queries/` にある `*.query.ts` では Drizzle、`__tests__/` のテストでは `bun:test` も許す。zod は、WebAuthn の `clientDataJSON` を検証する `parse-client-data.ts` で当面許す。ここで検証するのは、contract が受け取った文字列をデコードした後の値なので、すぐには contract のスキーマに移せない。検証をどこに置くかは、設定の TODO に残す。

## 手元の検査

`bun run check` は `tooling/check/check.ts` が流す。

- **server のテストを流すか**(ユーザーが決めた):`apps/server/`・`packages/` と、直下の `compose.yaml`・`bun.lock`・`bunfig.toml`・`tsconfig.base.json` のどれかに触れた変更でだけ、server のテスト(DB を使うものを含む)を流す。直下の4つは、テストの DB を動かすか、全部のワークスペースが読むファイルで、lock だけが変わる更新(間接の依存が上がる)でも、server の振る舞いは変わりうる。管理画面や tooling だけのブランチで、毎回 server のテストを待たないため。流さないときは、そのことを1行出す。CI は `--all` で、いつも全部流す。
- **server のテストをまとめて外す**:server のテストには、DB を使うものと使わないものが混ざっていて、パスでは分けられない。どちらも `apps/server/` と、それが import する `packages/` と、直下の共有のファイルしか読まないので、そこに触れていなければ、DB を使わないテストの結果も変わらない。
- **変えたファイル**:一番近いフェーズのブランチか main(`origin/phase/*` と `origin/main` のうち、HEAD にあってそこに無いコミットが一番少ないもの)から分かれた点と、今の作業ツリーとで中身が違うファイル(コミット・ステージ・作業ツリーのどこで変えたかは問わない)と、untracked のファイル(`.gitignore` で外したものは除く)。check が確かめるのは作業ツリーの中身なので、コミットした変更を、作業ツリーで分かれた点の中身に戻したファイルは数えない(Codex のレビューで挙がった。push したコミットは CI が全部流す)。stack で、ほかのブランチの上に積んだブランチでは、下のブランチの変更も数える。移したファイルは、移す前のパスも数える(server から外へ移したときも流す)。パスは `-z` で読む(既定では、日本語のパスを引用符で囲んで出し、前方一致で比べられない)。比べる元が見つからないときは、全部流す。
- **bunfig.toml の除外を引き継ぐ**:`bun test` の `--path-ignore-patterns` は、bunfig.toml の `pathIgnorePatterns` に足されず、置き換わる(確かめた)。server を外すときは、bunfig.toml を読み、その除外に `apps/server/**` を足して渡す。除外を2か所に書かないため。
- **段を同時に流さない**:整形の確認・lint・型検査・テストを同時に流すことは、短くなるなら入れると決めていた(ユーザーが決めた)が、測るとほとんど縮まなかったので、入れなかった。時間のほとんどはテストの段で、lint と型検査は合わせて4秒ほどしかない。段ごとの時間は、整形の確認 0.1 秒・lint 2.5 秒・型検査 1.4 秒・server を除く直下の `bun test` 64.6 秒(うち `tooling/lint` の fixture のテストが 53.2 秒)・管理画面のテスト 8.5 秒・server のテスト 23.2 秒(DB の用意を含む)。fixture をまとめて lint するようにしてから測ると、server を除く直下の `bun test` は 12.2・14.9 秒(うち fixture のテストが 1.6〜1.7 秒)になった。

  10コアの手元で、2回ずつ測った(fixture をまとめて lint する前)。

  | 流し方                    | 順に          | 同時に        |
  | ------------------------- | ------------- | ------------- |
  | server のテストも流す     | 98.1・94.2 秒 | 92.2・95.8 秒 |
  | server のテストを流さない | 71.4・71.2 秒 | 69.6・69.6 秒 |

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
- 読むのは「機械で探す語」の表だけで、探す表記・代わりに書くもの・探す範囲・除く範囲を、その表が持つ。ほかの表は人が読むためのもので、書き方を自由に変えられる。最初は、ほかの表の「使わない表記」から代わりの表記を引いていた。そのために補足の括弧や「(同じ)」の書き方を決めて読む仕組みが要り、用語集を読みやすい形に変えられなかった。
- 用語集の表をそのまま読み、表記を足したり変えたりしても検査のコードは直さない。用語集を唯一の出どころにするため。
- 表の形が崩れると、検査が黙って語を読み落とす。そこで、「機械で探す語」の表が無いこと、表の外にある行、列の数が合わない行、空の代わりに書くもの、空の探す範囲、`/` で終わらない探す範囲と除く範囲を、誤りとして落とす。行の字下げは無視する。
- 除く範囲は、探す範囲の中に、同じ表記を別の意味で正しく使うフォルダがあるときに書く。「指摘すること、指摘しないこと」は、lint の診断を「指摘」と書いたときに止めるもので、`tooling/` で探す。`tooling/review/` の prompt は、レビューの指摘の意味でこの言い回しを使ってよいので、除く。探す範囲の書き方に括弧の注記を足すより、列で持つ方が、読み違えずに読める。
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

- 1つのフォルダに置けるのは10件まで。`__tests__`・`__stories__` と、`AGENTS.md`・`CLAUDE.md`・`DECISIONS.md`・`README.md` は数えない。story は、テストと同じく部品の隣の `__stories__` に置き、部品のフォルダの件数を使わない(部品が多いフォルダほど story も多い)。`__stories__` を置けるのは管理画面の `src/` の下だけで、中には `*.stories.ts` と `*.stories.tsx` だけを置ける。story を `__stories__` の外に置くと、Storybook にもテストにも載らないので、それも止める。どこにでも置けると、ふつうのファイルを `__stories__` に入れて、件数の検査をすり抜けられる(Codex のレビューで見つかった)。リポジトリの直下と、`.` で始まるフォルダの中は検査しない(設定ファイルの置き場所がツールで決まっているため)。`.` で始まるフォルダも、親のフォルダでは1件と数える。
- フォルダの名前は kebab-case(`__tests__`・`__stories__` は除く)。`__tests__` と `__stories__` の中にフォルダは作れない。
- 一覧は `git ls-files -z` で取る。日本語のファイル名が引用符付きで返ってくるのを避けるため。作業ツリーから消したファイルは数えない。
- わざと約束を破る fixture を置く `tooling/lint/fixtures/invalid/` は、この検査から外す。
- 色と文字の見本(`apps/admin/src/ui/specimens/`)・story(`__stories__`)・Storybook の設定(`.storybook/`)は、テストの側(テストとテストの部品)・story・Storybook の設定だけが import できる(本番のコードから読むと、色ごとの utility の決まりの外の部品や、Storybook の依存が本番に入る)。テストの部品(`src/testing/`)と同じ検査で止める。
- テストの部品(`apps/admin/src/testing/` など)を import できるのは、テストと、管理画面の story(`__stories__`)だけ。画面の story は、テストと同じ作り物の server と認証器で動かす。story は本番のビルドに入らない(Storybook だけが読む)。
- server と管理画面の `@/` で始まる import と re-export は、それぞれの `src/` からのパスに直して検査する。相対パスと同じ場所を指せるので、同じ制限をかける。
- drizzle-kit が migration を書き出す `apps/server/src/db/migrations/` と、その下のフォルダは、名前と数の検査から外す。drizzle-kit は migration を1件ごとに `20261121073110_create-notes/` のようなフォルダに書き、名前と数はこちらで変えられない。名前の先頭の日時が適用する順番を表すので、kebab-case にもそろえられず、migration は増える一方なので10件にも収まらない。外すのはこのフォルダの下だけで、親の `apps/server/src/db/` では、ほかと同じく1件と数える。
- 同じ理由で、migration のフォルダは oxfmt の整形からも外す(`.oxfmtrc.json` の `ignorePatterns`)。drizzle-kit が書く `snapshot.json` の配列の折り返しが oxfmt と違い、`bun run check` の整形の確認で落ちた(使い捨ての migration で確かめた)。生成物を整形し直すと、生成し直すたびに差分が出る。SQL と JSON は Oxlint の対象ではないので、lint の設定は変えない。
- 並べ替えでは `localeCompare` を使わない。テストを書いている途中で、`localeCompare` が実行環境のロケールで順番を変え、テストの期待と食い違った。文字コードの順で並べる。

## 再レンダリングの期待の検査

`tooling/structure/admin/` のテストが、管理画面の state を持つフォルダ(`src/features/`・`src/components/`・`src/routes/` の直下のフォルダ)に、「再レンダリングの期待」の見出しと中身があるかを確かめる(決まりと理由は `apps/admin/DECISIONS.md` の「再レンダリングの期待」)。

- state を持つかは、製品のコード(`__tests__` と `__stories__` の外)が `react` から `useState`・`useReducer`・`useSyncExternalStore` を import しているかで決める。フォルダの全ファイルを見るので、lint ではなくこのテストで確かめる。
- TanStack Form の値や TanStack Query の結果だけを持つフォルダは、対象にしない。どちらもライブラリが購読の範囲を絞り、state の置き場所を書き手が選ばない。
- フォルダに `DECISIONS.md` があれば、その見出しの下に1行でも書いてあるかを見る。無ければ、`apps/admin/DECISIONS.md` の見出しの下に、フォルダのパス(`src/features/passkeys/` の形)があるかを見る。
- 確かめるのは、書いてあるかまで。期待が妥当か、テストが期待を守っているかは、レビューで見る。
- 管理画面だけに掛かる検査(この検査と、`__stories__` に置くファイルの検査)は、`tooling/structure/admin/` にまとめる。

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

GitHub Actions の workflow を、`.github/workflows/` に2つ置く。job の名前(`check`・`commit-messages`)は、main とフェーズのブランチの ruleset で、通ることを必須にする check として登録した名前なので、変えるときは ruleset も直す。

- **`check`**(`check.yml`):PR と、main とフェーズのブランチへの push で、`bun install --frozen-lockfile` と `bun run check --all` を流し、client をビルドして CLI を1回流す(`packages/client/DECISIONS.md`)。PR の CI は、その時点の base に merge した中身で流れるので、ある PR の最後の CI が、別の PR が入る前に流れていると、2つを合わせた中身はどこでも流れない。そこで ruleset で、PR の branch が base の先端を含む中身で CI に通っていることを、merge の条件にする(必須にする check に付ける、ruleset の strict required status checks。ユーザーが決めた)。それぞれ通った2つの PR が、合わせると落ちてフェーズのブランチを壊すのを、入る前に止める。先端を取り込むときは、「Update branch」で merge commit を作らず、rebase で合わせる(stack の linear history と同じ考え方)。ruleset で守るブランチへの push でも流し、入れた後の中身を確かめる。手元と違い、変えたファイルにかかわらず server のテストも流す(「手元の検査」)。テスト用の PostgreSQL は、手元と同じく `bun run check` が Docker Compose で起動する(直下の `DECISIONS.md` の「PostgreSQL の用意」)。
- **`commit-messages`**(`commit-messages.yml`):PR で、PR のコミットのメッセージと、PR のタイトルを確かめる。merge の方法は、merge commit・squash・rebase のどれも許す(直下の `DECISIONS.md` の「ブランチとレビュー」)。merge commit と squash では PR のタイトルが入れた先に残るコミットの1行目になり、merge commit と rebase では PR のコミットもそのまま残るため。
- **子の PR の追加行数**:PR を作る前に上限超過に気づけるよう、必須のタイトル検査で追加行数も確かめる。手元と CI で同じスクリプトを使い、数え方をそろえる。stack では、その PR で増えた分だけを読むので、base と head の共通の祖先からの差分を使う。フェーズのブランチに main を取り込む PR(head が、base に無い main のコミットを含む)では、base の first-parent の履歴で head が含む一番新しいコミットに、取り込んだ main を merge した中身からの差分を使う(取り込んだ後に base が進んでも、進んだ分を数えないため。base と head の共通の祖先は、取り込みの PR が重なると main の側のコミットになりうるので使わない)。main の hotfix は main に入るときに数えてあるので、取り込みで数え直すと、ぶつかりの直しが無くても上限を超える。ぶつかりを直した行や、取り込みに足した行は数える。
- **workflow を分ける**:`commit-messages` は、PR のタイトルを直したとき(`edited`)にも流す必要がある。`check` を同じ workflow に置くと、タイトルや本文を直すたびに `check` も流れる。job の `if` で `check` を飛ばすと、飛ばした job は通ったものとして扱われ、落ちていた `check` が、タイトルを直しただけで通ったことになる。同じ理由で、本文だけを直したときも `commit-messages` を飛ばさない。

### メッセージの検査

- **同じ検査を2か所に書かない**:`tooling/ci/check-pull-request-messages.ts` は、メッセージを1件ずつ一時ファイルに書き、commit-msg の hook のスクリプト(`tooling/git-hooks/commit-msg.ts`)にそのまま渡す。hook の検査を変えれば、CI の検査も変わる。`#` で始まる行の扱いも hook と同じになる。
- **範囲は PR のコミットだけ**:`git rev-list` で、`pull_request` イベントが渡す base の SHA から head の SHA までをたどる。main に入ったコミットは、入るときに確かめてある。検査を厳しくしても、過去のコミットで PR が落ちないようにするため。履歴をたどるので、checkout は `fetch-depth: 0` にする。
- **PR のタイトルは、入れた先に残る1行目として確かめる**:merge commit と squash は、どちらもタイトルの後ろに ` (#番号)` を足して1行目にする(リポジトリの設定で、1行目を PR のタイトルにしてある)。確かめるのは番号を足した1行目なので、半角に換算した幅は番号まで含めて数える。
- **PR の本文は確かめない**:merge commit と squash のコミットの本文を空にする設定にしてあり、PR の本文は履歴に残らない。本文も残す設定にするなら、本文も確かめる。
- **タイトルは環境変数と標準入力で渡す**:`${{ }}` で `run` に直接書くと、タイトルがシェルのスクリプトの一部として展開され、タイトルに書いたコマンドが流れる(script injection)。引数でなく標準入力で渡すのは、`-` で始まるタイトルを option と読ませないため。
- **ほかのリポジトリの名前は探さない**:CI には名前の一覧が無い(一覧は手元にだけ置くため)。名前は、手元の `bun run check` とコミットのときの hook が探す。
- **このスクリプトのテストだけ、時間の上限を30秒にする**:メッセージ1件ごとに、hook と commitlint の Bun のプロセスを起動し、1件に約0.3秒かかる(git の用意は1テストで約0.07秒)。テスト7つを同時に流すと、ファイル全体で約3秒かかり、load average(1分)が33のマシンでは3.4〜4.4秒と、`bun test` の既定の5秒に近づく。1テストのメッセージは、最小の2件(コミット1件とタイトル)に近く、全部で18件のうち減らせるのは数件だけなので、減らさずに `setDefaultTimeout` で `tooling/ci/__tests__/check-pull-request-messages.test.ts` だけ延ばす。メッセージを hook に1件ずつ渡す形は、「同じ検査を2か所に書かない」のとおり変えない。

### 守りの設定

- **`permissions` は `contents: read` だけ**:どちらの job も、リポジトリを読むだけで何も書かない。既定の権限はリポジトリの設定で決まり、書き込みを含む設定にもできる。最上位で決めていることを、`tooling/structure/` のテストが確かめる。
- **checkout の `persist-credentials: false`**:token を `.git/config` に残さない。後の step(依存の install で流れる script を含む)から token を読めないようにする。
- **actions はコミットの SHA で固定する**:タグは付け替えられるので、同じタグでも別のコードが流れうる。SHA だけでは何のバージョンか読めないので、行末のコメントにバージョンを書く(設定ファイルにコメントを書かない約束の例外。直下の `DECISIONS.md`)。形は `tooling/structure/` のテストが確かめる。上げるときは、SHA とコメントを一緒に直す。
- **`concurrency`**:PR は番号ごとにまとめ、新しい実行が古い実行を止める。main とフェーズのブランチへの push の実行は SHA ごとに分け、新しい実行で古い実行を止めない。どのコミットにも結果を残すため。
- **runner を `ubuntu-26.04` に固定する**:`ubuntu-latest` は GitHub が切り替えるので、Docker や Compose のバージョンが知らないうちに変わる。
- **`timeout-minutes`**:既定の6時間は長すぎる。`check` は15分、`commit-messages` は5分にする。
- **依存を cache しない**:`bun install` は CI で1秒かからない(810ms。実測)。cache の action を足すほどではない。

## レビューのスクリプト

`bun run review`(`tooling/review/review.ts`)が、1つの観点のレビューを1回流す。進め方と理由は、直下の `DECISIONS.md` の「ブランチとレビュー」にある。

- **prompt**:`tooling/review/prompts/` に、観点ごとのファイル(見る範囲・見ない範囲)と、どの観点にも共通の `common.md`(守ること・重要度・出力の形)を置く。スクリプトは、読むものの場所と「割り切ったこと」を添えて組み立て、出力の形を最後に置く。prompt を Markdown にするのは、コードの文字列より読み書きしやすく、用語集の検査にも掛かるため。
- **レビューさせる中身**:レビューするコミットの中身を、`git archive` で一時フォルダに書き出し、そこを外の CLI の作業フォルダにする。作業ツリーの状態(コミットしていない変更や、別のブランチを checkout した worktree)に左右されず、どの worktree から流しても、同じものを見せられる。コミットしない手元のファイル(`AGENTS.local.md`・`.private/`)も見せない。
- **差分とコミットのメッセージ**:書き出した中身には git の履歴が無いので、差分(`git diff base...head`)とコミットのメッセージを、別のファイルにして渡す。Cursor の ask モードは shell を使えないので、どのみち差分はファイルで渡す必要がある。
- **割り切ったこと**:レビューするコミットの全 `DECISIONS.md` から「## 割り切ったこと」の節を集め、prompt に書き込む。ファイルの場所を渡すだけより、確実に読ませられる。コードのブロックの中の、見出しの形の行では区切らない。
- **読み取り専用**:Codex は `-s read-only`、Cursor は `--mode ask` で呼ぶ(ask は書き込みも shell も断る。確かめた)。コマンドの組み立てを純粋関数にし、読み取り専用で呼ぶことをテストで確かめる。外の CLI を実際に呼ぶ部分はテストしない。
- **モデルの選び方**:レビューは Codex CLI で流し、観点ごとのモデルは `perspectives.ts` とテストに記す。使えないときはユーザーに聞く。
- **UI/UX とアクセシビリティのモデル**:Codex で流す(ユーザーが決めた)。Cursor の Gemini 4 Neon は、月の上限に当たると結果を返さなかった。モデルと reasoning effort は、ビジネスロジックと同じ `gpt-6.2-sol`・`xhigh` にした(エージェントが決めた)。この観点も、画面を描かずに、状態の移り変わり・フォーカスの移り方・accessible name を、部品と hook をまたいでコードから読み取るので、ビジネスロジックと同じ深さで読むモデルが要る。
- **言葉と規約のレビュー**:言葉は Terra、規約はビジネスロジックと同じ Sol に任せる。複数の PR を並行して進めるときの、レビューの待ち時間を短くするため。
- **つながりと一貫性のモデル**:Codex にした(エージェントが決めた)。フェーズ全体の差分と、リポジトリ中の文書を読み合わせるので、子のブランチのビジネスロジックとセキュリティと同じく、深く読むモデルを使う。
- **古い base のブランチ**:`--base` に渡した手元のブランチが、origin の同じ名前のブランチより古い(その祖先にある)ときは、流さずに止め、`git fetch` してから `origin/<ブランチ>` を渡すよう伝える。古い base と比べると、base に入ったほかの PR の変更まで差分に入り、費用がかさみ、範囲の外の指摘も出る。origin の方に黙って替えると、prompt に書く base の名前と、比べたコミットが食い違う。手元の方が新しいときと、分かれたときは、手元のまま比べる。stack で、まだ push していないコミットを持つ手元のブランチに積むときに要る。
- **`--head` にコミットを許す**:手元のブランチの名前に加え、`git rev-parse` で1つのコミットに解決できる名前も渡せる(ユーザーが決めた)。両方に当てはまる名前はブランチとして扱う。直したコミットだけを見る2回目のレビューや、PR の先端のコミットをレビューするときに、手で材料をそろえる手間を省ける。コミットを渡したときも今のブランチのフォルダを使う(ユーザーが決めた)。これでブランチごとの回数がそろう。detached HEAD から流すときは、手元のブランチを渡す。
- **結果の置き場所**:メインの checkout の `.private/reviews/<ブランチ>/` に、`<観点>-<回>.md`(結果)を書く。流すごと(試行ごと)に、`<観点>-<回>.<試行>.json`(試行の記録)・`<観点>-<回>.<試行>.prompt.md`(prompt)・`<観点>-<回>.<試行>.log`(外の CLI の出力)を書く。`<ブランチ>` はレビューするブランチの名前とし、コミットを渡したときは今のブランチの名前とする。コミットしない。worktree を消しても残り、どの worktree から流しても、同じブランチの回数がそろう。メインの checkout は、ほかのリポジトリの名前の一覧と同じく、`git rev-parse --git-common-dir` でたどる。
- **回数**:今の回は、結果のファイルの一番大きい番号の次にし、観点ごとの上限(子のブランチの観点は3回、つながりと一貫性は2回)を超えたら流さない。文書だけの上限は守られないため(直下の `DECISIONS.md` の「境界はツールで強制する」)。2回目からは、前の回の結果と採否の記録と、前の回の head から今の head までの差分(直したコミット)を添え、前の回の現象が解消したかと、直しで触った呼び出し元への影響を確かめさせ、新しい指摘を直したコミットの範囲に絞る(ユーザーが決めた)。毎回ブランチの全体を見直させると、前の回の指摘が解消したかを確かめないまま、前からあった別の問題と、直しへの指摘が混ざって往復が続くため。仕様を変えたとき・別の PR を取り込んだとき・直しの影響が広がったときは、直したコミットの外にも影響が出るので、`--full` で全体を見させる(前の回の結果と採否は添える)。前の回の head が今の head の祖先に無い(rebase した)ときと、前の回の試行の記録が無いときは、直したコミットを決められないので、全体に切り替えずに止まり、`--full` を求める(ユーザーが決めた)。前の回の判定を読めなかったときも、全体をレビューし終えたか分からないため、結果を残して `--full` を求める。黙って全体に切り替えると、範囲が広がったことに気づかないまま、重いレビューが流れる。2回目からの prompt は、`prompts/rereview.md`(前の回の指摘)と `prompts/fixes.md`(直したコミット。`--full` では添えない)。前の回の結果と採否の記録は、差分と同じフォルダに写して渡す(Cursor の ask モードは、`--workspace` と `--add-dir` の外を読めない)。
- **レビューしたコミット**:prompt の頭に、base と head のコミットの SHA を書く。ブランチをレビューするときは、ブランチの名前も添える。prompt は結果と同じフォルダに残るので、結果ごとに、どのコミットをレビューしたかが分かる。SHA は最初に1回だけ決め、差分があるかの判定・書き出す中身・差分・コミットのメッセージ・「割り切ったこと」に同じ組を使う。流している間にブランチが進んでも、記録とずれず、差分の無いレビューも流れない。観点ごとに流すので、ある観点が LGTM になった後に、別の観点の指摘を直すコミットを足すことは普通に起きる。そのコミットは PR の本文の観点の表に書き(直下の `AGENTS.md`)、流し直す決まりは足さない。足すと、観点の数だけ回数と費用が増える。
- **結果の最後の行**:`VERDICT: LGTM` か `VERDICT: CHANGES_REQUESTED` のどちらかにさせ、スクリプトが読んで判定を出す。形から外れたら、読めなかったと出して終了コード1で終える。崩れた形を推し量って読むと、LGTM でないものを LGTM と取り違えうる。
- **失敗**:外の CLI が失敗したときや、結果が空のときは、結果のファイルを消し、その回を数えない。外の CLI の出力は `.log` に残す。試行ごとにファイルの名前を分け、失敗した試行の prompt・出力・記録を、同じ回の次の試行で上書きしない。結果(`<観点>-<回>.md`)は回ごとに1つで、失敗した試行では消す。prompt と出力を回ごとの名前で書くと、次の試行が上書きし、どの試行がなぜ失敗したかを後から確かめられない。
- **試行の記録**:流すごとに、runner・実際に使ったモデル(Codex は reasoning effort も)・観点・base と head・始めた時刻と終わった時刻・終わった理由(`lgtm`・`changes-requested`・`unreadable-verdict`・`failed`)と、外の CLI の終了コードを記録する。外の CLI を起動する前に書き、終わったら終わりを足すので、途中で止まった試行は、終わりの無い記録として残る。どのモデルで流したか、何回失敗したかを、ブランチの名前やチャットから推し量らずに、記録から数えるため。
- **採否の記録**:指摘を片付けた担当が、その場で `bun run review:decide` を流し、指摘の番号・採否・直したコミットの SHA か根拠を、`<観点>-<回>.decisions.jsonl` に1行ずつ足す。PR の本文やチャットから採否を拾い直さずに、直した・退けた・割り切った・低のまま残した件を数えるため。エージェントの環境によっては、worktree からメインの checkout の `.private/` に直接書けないので、script が書く。結果にある指摘の番号と、コミットに解決できる指定だけを受け付け、SHA は省かない形で書く。行を足すだけで書き換えないので、直した後に戻したときは、同じ番号に新しい行を足す(後の行が今の採否)。
- **高・中を付けるときは、使う人の立場で判断する**:問題が起きる例を作れても、その手順を普段の利用や開発で選ぶ理由があるとは限らない。手順が自然かはレビュー担当の判断に任せ、変更によって何に困るのかはコードや仕様に照らして確かめる。

## スペルチェック

エディタの Code Spell Checker(cspell)が、プロジェクトやライブラリの語に波線を出し、本当の綴りの誤りが埋もれていた。直下の `cspell.json` に辞書を置き、エディタと CLI の両方が読む。

- **フェーズの終わりに1回だけ集める**(ユーザーが決めた):知らない語の大半は、プロジェクト・ライブラリ・Postgres の語で、本当の綴りの誤りは少ない。PR のたびに辞書を手入れさせるのはノイズなので、`bun run check` にも CI にも入れない。
- **CLI は依存に足さない**:`bunx` でバージョンを固定して一時的に取ってくる(`tooling/AGENTS.md`)。フェーズの終わりにしか流さないものを、毎回の `bun install` で入れないため。
- **`words` と `ignoreWords` を分ける**:`words` はプロジェクトの語で、エディタが綴りの候補にも出す。テストのデータ(base64 の切れ端、URL のエンコード)、わざと崩した綴り(未知の引数を試す `--urll` など)、コードの断片(正規表現の文字の集まり、option の一部など)は `ignoreWords` に置き、候補に出さない。

## query のファイルの置き場所

`tooling/structure/__tests__/repository.test.ts` は、server の `src/` にある `*.query.ts` が `queries/` の直下にあることを確かめる。ほかの query を呼ぶファイルも同じ場所に置くので、Drizzle の import の有無にかかわらず名前で検査する。

## 割り切ったこと

- **TSDoc の言い回しの検査**:`tsdoc-role-only` は条件・例・補足・理由の言い回しを正規表現で見るので、すり抜けも誤検知もある。文の意味を読むには、日本語の構文の解析が要る。すり抜けはセルフレビューで見て、誤検知は言い回しを外して直す。
- **字下げのコードのブロック**:用語集の検査は、Markdown の、4つの空白で字下げしたコードのブロックを扱わない。コードはフェンスで書くので、受け入れる。
- **`Promise.allSettled`・`Promise.any`**:どちらも失敗を値に変えられるが、`no-catch-outside-entry` は止めていない。結果の型に失敗が出るので、握りつぶしがコードから見える。使う場面が出たら、止めるかを決める。
- **`import()` のほかの読み込み**:`no-dynamic-import` は `import()` だけを止める。`import.meta.require` や `node:module` の `createRequire` を使えば、境界の外のモジュールを読み込めるが、普通は書かない形なので止めていない。
- **React の effect の間接的な呼び出し**:effect を `const run = useEffect` で別の変数に代入したり、`const { useEffect } = React` と分割代入したりすると、その変数からの呼び出しは診断を出さない。React の import をそのまま使うのが普段の書き方で、代入後の値まで追跡する手間に見合わない。`React.useEffect(…)` のようにドットで呼ぶ形は検査し、`React["useEffect"](…)` の形は見ない。
- **`-m` で書いたメッセージの `#` の行**:git は、エディタを開かないとき(`-m`・`-F`)はコメントを消さないが、commit-msg の検査は `#` で始まる行を読まない。エディタで書いたときの git のコメントと見分けられないため。commitlint も同じ扱いをする。`core.commentChar` を `auto` にしたときも、`#` として扱う。どちらも、普通の使い方では起きないので受け入れる。
- **commitlint の既定の除外**:commitlint は、本文のどこかに `Merge branch …` のような行があるメッセージや、`1.2.3` だけのメッセージを、形を確かめずに通す。普通のメッセージには現れず、通っても、名前と「機械で探す語」の検索は流れるので、受け入れる。
- **既にある hook**:`install.ts` は、ほかの `core.hooksPath` があれば置き換える(前の値を出す)。そのため、`.git/hooks` の hook も流れなくなる。このリポジトリでは、ほかの hook を使っていない。
- **PATH に Bun が無い環境**:hook は `bun` を PATH から探すので、PATH を引き継がない GUI の git クライアントなどでは、hook が失敗してコミットできない。黙って通すより安全なので受け入れる。
- **PR のタイトルの句点**:確かめるのは ` (#番号)` を足した1行目なので、タイトルを `。` で終えても `subject-full-stop` では止まらない。merge commit と squash の1行目は番号で終わり、句点では終わらないので受け入れる。
- **hook を通らないメッセージの中の名前**:PR のタイトルと本文、GitHub の画面で作ったコミット(レビューの提案の取り込みなど)のメッセージは、手元の hook を通らない。CI にも名前の一覧が無い。一覧を CI に渡すと、一覧そのものを GitHub に預けることになり、見つけた名前も公開のログに出る。PR はエージェントが作るので、タイトルは、作る前に手元で `tooling/ci/check-pull-request-messages.ts` に通す(直下の `AGENTS.md`)。PR の本文は、どの検査も読まない。GitHub の画面で作ったコミットのメッセージは、CI が形を確かめるが、名前は探さない。どちらも書いた人が見る。本文を手元で探す仕組みは、足さないとユーザーが決めた。
- **レビューの回数の数え直し**:回数は、メインの checkout の結果のファイルから数える。結果のファイルを消すと回数が戻り、同じ名前のブランチを作り直すと、前のブランチの回数を引き継ぐ。どちらも普通の使い方では起きず、回数の上限は費用を抑えるための目安なので、受け入れる。
- **同じ観点のレビューの同時実行**:同じ結果のフォルダで、前の回の結果が書かれる前に同じ観点を流すと、同じ回の番号を使い、prompt が上書きされる。結果と prompt に記録された SHA が食い違うことがある。結果を書いてから次の回を流せば起きず、回数の上限は費用を抑えるための目安なので、排他の仕組みを足す手間に見合わない。
- **レビューの一時フォルダ**:レビューの途中でスクリプトを止めると、書き出したコミットの中身が、OS の一時フォルダに残る。OS が片付けるので、受け入れる。
- **SHA を先に決めることのテスト**:先に決めた SHA の組が、ブランチが進んだ後も同じ差分を指すことはテストで確かめる。スクリプト全体で、差分の判定から材料の書き出しまで同じ組を使うことは、途中でブランチを進めて確かめる仕組みが要る。スクリプトが差分の判定と材料の書き出しで別々の組を使うようになると、モデルを選ぶ数秒の間に base が head を取り込んだとき、空の差分のレビューが1回流れ、回数を1回使う。この害に対して、仕組みを足す手間が見合わないので受け入れる。
- **Cursor の `--trust`**:書き出したコミットの中身を、Cursor に信頼させて読ませる(`--trust` が無いと、信頼するかを尋ねて止まる)。中身に Cursor の hook の設定があれば、Cursor が流しうる。レビューするのは、このリポジトリでエージェントとユーザーが作ったブランチのコミットで、同じ中身を `bun run check` と CI も流すので、受け入れる。MCP の server は、`--approve-mcps` を渡さないので動かない。外から来た PR をレビューするなら、`.cursor/`・`.claude/` などの設定のフォルダを除いてから渡す。
- **別の名前で受け直した server の client**:`admin-module-location` は、`const client = api` のように受け直した client からの呼び出しを見ない。管理画面では、client を `useAppContext()` から分割代入で受けるか、`ApiClient` の型を付けた引数で受けるので、受け直す書き方は普通は現れない。値の流れまで追う手間に見合わない。
- **`@/` の、区切りを細工した import**:`no-cross-workspace-import` と `tooling/structure/` のテストは、`@/` の後ろの文字列をそのまま `src/` に足して行き先を決める。`@//preferences/…` のように `/` を重ねた指定は、ワークスペースの中を指すのに lint が外と見なして止める。`\` を区切りに使った指定は、Bun では外のファイルを指せるが、macOS の lint は診断を出さない。人が書かない形で、ルールは絶対パスの import も見ないので、直さない。
