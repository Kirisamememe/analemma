# admin(Stilus、管理画面)

理由は同じフォルダの `DECISIONS.md` にある。デザインシステムの理由は `src/ui/DECISIONS.md` にある。線が要るときは、`border` から考えず、同文書の「枠と面の境界」の描き方(`separator-*`・`edge-outer` など)から選ぶ。

## 構成

- React + TanStack Router + TanStack Query の SPA。SSR しない。Vite でビルドし、server の `ADMIN_DIST_DIR` に出力先を指定すると、外部用のポートで API と同じ origin から配信する。
- `index.html`:Vite の入口。`vite.config.ts` の plugin が、`src/preferences/boot.ts` を1つの script にまとめて head に書き込む(言語と配色を、最初の描画の前に当てる)。
- `src/app/main.tsx`:React を描き始める入口。i18next の instance・ブラウザの履歴・API の client・認証器を組み立てて渡す。
- `src/app/app.tsx`:i18next の instance・server の状態(TanStack Query)・route をつないだ全体。
- `src/app/router.ts`:route の木と、router と query client を組み立てる関数(`createApp`)。ログインした後の画面へ移るたびに、移るのを待たせずに、server でセッションを確かめる。
- `src/api/`:server の API の client(contract の型付き)と、query client。features が使う、oRPC の失敗の仕分け(`call-api.ts`)・TanStack Router の context とログインの画面への移動(`app-context.ts`)・画面を離れる前の確かめ(`leave-confirmation.ts`)・TanStack Query の取得と送信とキャッシュ(`server-state/`)の包みも置く。取得したデータを画面間で保持する条件は `DECISIONS.md` の「server の API の呼び方」に従う。route はコードで定義する(ファイルから route を作る仕組みは使わない)。
- `src/routes/`:route ごとの画面。
- `src/queries/`:複数の feature が使う、server の API を呼ぶ処理(再認証と画像一覧の読み込み)。
- `src/components/`:複数の feature から使う、管理画面に固有の部品。`@/components/...` で import する。部品のコードは features を import しない(lint で止まる)。
- `src/i18n/`:訳と言語(i18next と react-i18next)。訳は `messages/` に言語ごとに1ファイル。i18next の instance は `create-i18n.ts` で作る。features が使う、訳を引く hook と今の言語を読む hook と訳のキーの型は `use-translate.ts` が、言語を切り替える hook は `use-change-locale.ts` が包む。
- `src/preferences/`:利用者が選ぶ言語と配色の、置き場所と値と、最初の描画の前に流す script(`boot.ts`)。言語の切り替えに html の `lang` と置き場所をそろえる関数(`sync-locale.ts`)。今の配色を読んで切り替える hook(`use-theme.ts`)と、html の `data-theme` に配色を当てる関数(`apply-theme.ts`。head の script と共有する)。
- `src/features/<名前>/`:画面をまたぐ、ひとまとまりの事柄(ログインと登録の判断、WebAuthn の変換など)。1つの画面だけの部品は `features/<名前>/ui/`。
- `.storybook/`:Storybook の設定(`main.ts`・`preview.tsx`)と、story を管理画面と同じ言語・配色・router の中で描く枠(`story-frame.tsx`)と、html の `lang` と `data-theme` を当てる hook(`use-html-preferences.ts`)。
- `src/testing/`:テストの部品(contract で型を付けた作り物の server と、管理画面の全体を描く関数と、部品を i18next の instance の下で描く関数)。テストと story だけが import できる(`tooling/structure/` のテストが止める)。
- `src/ui/`:デザインシステム。`theme.css`、`animation.css`(animation の class と keyframes)、`tv.ts`(merge の設定を入れた `tv`)、`typography.ts`(文字の役割)、`primitives/`(React Aria Components を包む部品。Dialog・Modal・Toast・Tooltip・選択肢の一覧・`FocusScope` は `primitives/overlays/`、並べ直せる一覧は `primitives/collections/`)、`layout/`(並べ方と文字)、`patterns/`(組み合わせた形)、`specimens/`(色と文字の見本と、story の展示用の枠 `story-stage.tsx`。本番のコードからは import できない)。層と決まりは `src/ui/DECISIONS.md`。
- `test-setup/`:管理画面のテストの前に読み込む、DOM の用意(happy-dom)。

## 書き方

- route の `beforeLoad` や `loader` で通信の応答を待たない。データを使う画面で取得し、待つ間は読み込み中の表示を出す(`DECISIONS.md` の「画面の遷移と読み込み」)。

- `features/`・`components/`・`ui/` では、hook を `hooks/`、純粋な関数を `logic/`、server の API を呼ぶ処理(読み込み・書き込み・query のキー)を feature の中の `queries/` に、使う部品の近くに置く。複数の feature が使う処理は `src/queries/` に置く。純粋な関数でも server の API を呼ぶ処理でもない `.ts`(ブラウザの API を呼ぶ、呼び出しのあいだ状態を持つ、渡された関数で外に書き込む、`crypto.randomUUID()` で値を作る、など)は、今の場所に置き、lint の設定の `effectfulModules` に足す(lint で止まる)。今はログインの gate・WebAuthn のブラウザでの処理・クリップボードへの書き込み・固定ページのフォームの最初の値を作る処理。
- ロジックはできる限り `.ts` に置き、同じフォルダの `__tests__` に `.test.ts` を置いてテストする。`.tsx` にはマークアップと、それをロジックにつなぐコードを置く。
- `.tsx` は、JSX の要素か fragment を書くファイルだけにする。JSX を書かない hook・context・テスト・story は `.ts` にする(lint で止まる)。
- `.ts` で React の値を import できるのは、hook のファイル(`use-*.ts`。export する関数は1つだけで、名前は `use` で始まる)と、context のファイル(`*-context.ts`。値として export するのは `createContext` の結果だけで、少なくとも1つは export する)だけ。lint はこの import の条件を検査し、`src/` の hook には隣のテストも求める。
- ロジックに切り出しにくい表示の出し分けは、同じフォルダの `__tests__` のコンポーネントのテストで確かめる。要素は role・label・text など利用者に見えるもので探し、利用者に見える結果を確かめる。マークアップの作りをなぞるテストは書かない。
- React の effect は、ほかの手段で書けない処理だけを、目的が分かる名前の hook の直下で使う。hook は `tooling/lint/config/admin-overrides.ts` の `ADMIN_EFFECT_HOOKS` と、`DECISIONS.md` の「React の effect」の hook の表に足す。この決まりはテスト・story・`.storybook/` にも掛かる(lint で止まる)。
- server との通信には contract の型を使い、応答の型を手で書かない。
- features の製品のコードから import できるのは、`react`(`.ts` では hook と context のファイルだけ)・`@analemma/contract`・管理画面の中のモジュールだけ。外のライブラリは `src/i18n/` と `src/api/` の部品を通して使う(lint で止まる)。`src/routes/` は今は対象外。
- features で API の失敗を仕分けるときは `callApi` を使う。
- state を持つ feature・`components/` の部品・`routes/` の画面のフォルダは、`DECISIONS.md` の「再レンダリングの期待」に、頻繁に変わる state(入力・進捗・pointer の動きなど)と、件数に比例して増える部品と、その state が変わっても再レンダリングしない範囲を書く。どちらも無ければ、無いことと理由を書く。フォルダに `DECISIONS.md` が無ければ、`apps/admin/DECISIONS.md` の同じ見出しの下に、フォルダのパスを添えて書く(見出しが無いと、テストで止まる)。
- 書いた期待は、同じフォルダの `__tests__` で確かめる。再レンダリングしない範囲だけを `Profiler` で包むか、その部品や hook の呼び出しを数え、操作の前後で増えないことを確かめる。回数は決めない。
- 管理画面のボタンには共通の `Button` を使う。必要な形や大きさがなければ `Button` に足す。共通の部品では必要な動作を実現できないときにだけ専用のボタンを作り、その理由を一番近い `DECISIONS.md` に書く。
- 操作を送っている間は、そのボタンを無効にする。同じ操作を続けて送らせない。
- route の `beforeLoad`・`loader` で、通信の応答を待たない。server のデータは画面の中で読み、読み込み中は `LoadingState`、読み込めなかったことは `ErrorState` で出す。見出しや操作を保ったまま、欄の中で1つの取得を出し分けるときは `QueryContent` を使う。
- パスキーでのログインの最中(options を取ってから、ログインの応答が届くまで)は、ほかの管理用 API を呼ばない。
- 登録用 URL は `/enroll#{token}`。token は URL の `#` の後ろから読み、server に送るだけにする。登録したら、履歴から登録用 URL を消す(`replace`)。
- パスキーの追加と削除は、再認証(`src/queries/reauthenticate.ts`)の資格情報と一緒に送る。取り消せない操作は、確認の Dialog を出してから送る。
- 画面のテストは、`src/testing/render-app.tsx` で、作り物の server(`create-fake-api.ts`)と作り物の認証器につないだ管理画面の全体を描いて、利用者に見える結果で確かめる。`App` を通さずに部品だけを描くテストは、`src/testing/render-with-i18n.tsx` で、i18next の instance の下で描く。
- 画面に出す文言は `src/i18n/messages/` の訳から引く。言語の選択肢の名前だけは、その言語での名前を `localeName`(`Intl.DisplayNames`)で引く。features は `useTranslate` を使い、`src/routes/` は今は react-i18next の `useTranslation` を直接使う。キーは英語の訳(`en.ts`)に足し、同じキーをほかの言語にも足す。引数は `{{name}}` で書き、どの言語も英語と同じ引数を持つ(テストで止まる)。features で引数を取らないキーを値として持つ型は `MessageKey` にする。
- 言語を足すときは、`src/i18n/locales.ts` の `LOCALES` と、`src/i18n/resources.ts` の `RESOURCES` と、`src/ui/primitives/ui-provider.tsx` の `ARIA_LOCALES`(React Aria Components に渡す地域を付けた言語)に足し、`messages/` にファイルを置く。
- 言語は i18next の `changeLanguage` で切り替える。html の `lang` と `localStorage` は、`sync-locale.ts` がそろえる。
- route の code splitting(`import()`)は使わない。`no-dynamic-import` は、今はそのまま効かせる。
- 画面のコード(`src/ui/` と `src/features/*/ui/` の外)には、見た目の class を書かない。書けるのは `grow`・`shrink-0`・`min-w-0`・`truncate`・`sr-only` だけで、`className` は文字列のリテラルにし、`style` は書かない。並べ方・文字・色は `ui/` の部品の props で決める(lint で止まる)。
- 部品は、層の向き(patterns → primitives・layout)を守る。React Aria Components は `ui/primitives/` の中でだけ使い、`tv` は `ui/tv.ts` から import する(ここまでは lint で止まる)。primitives は自分の props の型を持ち、ライブラリの props の型を extends しない(lint では止まらないので、セルフレビューで見る)。
- 文字の役割は `Text`・`Heading` の `variant` で選ぶ。
- 部品を足したら、同じフォルダの `__stories__` に story を足し、`src/__tests__/stories.test.tsx` の一覧にも足す。story は画面のコードと同じ決まりで、部品と props だけで組む(lint で止まる)。title と export 名は `DECISIONS.md` の「Storybook」の命名規則に従う。tone・variant・状態(無効・送信中・invalid など)ごとに story を分け、見比べられるようにする。
- `ui/` の部品の class は、`theme.css` の役割と `animation.css` の animation の class だけで書く。止める class と理由は `src/ui/DECISIONS.md` の「検査」。止められたら、部品や役割を足すかを考え、`[…]` や抑制で逃げない。
- `ui/` と `features/*/ui/` で、1つの文字列に書ける class は8個まで。超えるなら、`tv` の設定と `tv` の関数に渡す `className` は配列にし、意味のまとまり(並べ方・箱・色・状態など)ごとに分ける。JSX の `className` の文字列は `tv` に移す(lint で止まる)。

## 開発とテスト

- 開発のサーバーは `bun --cwd=apps/admin run dev`(`http://localhost:5173`)。`/api` と `/media`(配信用の画像)は server の外部用のポート(`http://localhost:8787`)へ流す。開くのは `localhost` で、`127.0.0.1` ではない(server の `AUTH_ORIGIN` とパスキーの RP ID に合わせる)。
- `src/` のテストは、リポジトリの直下の `bun test` からは外し、`apps/admin` の `bun test` で流す(`bun run test` は両方を流す)。`apps/admin/bunfig.toml` が DOM を用意してから流す。
- Vite の設定とビルドのテスト(`__tests__/`)は、DOM を用意しない直下の `bun test` で流す。
- Storybook は `bun run storybook`(`http://localhost:6006`)。ツールバーで light・dark と言語を切り替える。

## セルフレビューの観点

- コンポーネントのテストが、決まった文言を描画して確かめるだけになっていないか。出し分けの条件ごとに、利用者に見える結果の違いを確かめているか。
- `.tsx` に、`.ts` へ切り出せるロジックが残っていないか。
- state を足したり、置く場所を変えたりしたら、「再レンダリングの期待」とそのテストを見直したか。小さな子孫の操作が、祖先や兄弟を再レンダリングしていないか。
- 画面に、訳を通さない文言を直接書いていないか。
- primitives の props の型に、React Aria Components の props の型を流用していないか。
- 部品の見た目を作ったり変えたりしたら、Storybook をブラウザで開き、light と dark、状態ごとに描いて、並び・中心・余白を測ったか(アイコンと文字の中心、左右と上下の余白)。happy-dom のテストは配置を計算しないので、通っても見た目のずれは残る。
