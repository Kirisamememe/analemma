# admin(Stilus、管理画面)

理由は同じフォルダの `DECISIONS.md` にある。デザインシステムの理由は `src/ui/DECISIONS.md` にある。

## 構成

- React + TanStack Router + TanStack Query の SPA。SSR しない。Vite でビルドし、server が同じ origin で静的ファイルとして配信する。
- `index.html`:Vite の入口。`vite.config.ts` の plugin が、`src/preferences/boot.ts` を1つの script にまとめて head に書き込む(言語と配色を、最初の描画の前に当てる)。
- `src/main.tsx`:React を描き始める入口。i18next の instance・ブラウザの履歴・API の client・認証器を組み立てて渡す。
- `src/app.tsx`:i18next の instance・server の状態(TanStack Query)・route をつないだ全体。
- `src/router.tsx`:route の木と、router と query client を組み立てる関数(`createApp`)。ログインした後の画面は、開く前に server でセッションを確かめる。
- `src/api/`:server の API の client(contract の型付き)と、query client。route はコードで定義する(ファイルから route を作る仕組みは使わない)。
- `src/routes/`:route ごとの画面。
- `src/i18n/`:訳と言語(i18next と react-i18next)。訳は `messages/` に言語ごとに1ファイル。i18next の instance は `create-i18n.ts` で作る。
- `src/preferences/`:利用者が選ぶ言語と配色の、置き場所と値と、最初の描画の前に流す script(`boot.ts`)。言語の切り替えに html の `lang` と置き場所をそろえる関数(`sync-locale.ts`)。
- `src/features/<名前>/`:画面をまたぐ、ひとまとまりの事柄(ログインと登録の判断、WebAuthn の変換など)。1つの画面だけの部品は `features/<名前>/ui/`。
- `src/testing/`:テストの部品(作り物の server と、管理画面の全体を描く関数と、部品を i18next の instance の下で描く関数)。テストだけが import できる(`tooling/structure/` のテストが止める)。
- `src/ui/`:デザインシステム。`theme.css`、`tv.ts`(merge の設定を入れた `tv`)、`typography.ts`(文字の役割)、`primitives/`(React Aria Components を包む部品)、`layout/`(並べ方と文字)、`patterns/`(組み合わせた形)。層と決まりは `src/ui/DECISIONS.md`。
- `test-setup/`:管理画面のテストの前に読み込む、DOM の用意(happy-dom)。

## 書き方

- ロジックはできる限り `.ts` に置き、同じフォルダの `__tests__` に `.test.ts` を置いてテストする。`.tsx` にはマークアップと、それをロジックにつなぐコードを置く。
- ロジックに切り出しにくい表示の出し分けは、同じフォルダの `__tests__` の `.test.tsx` で確かめる。要素は role・label・text など利用者に見えるもので探し、利用者に見える結果を確かめる。マークアップの作りをなぞるテストは書かない。
- server との通信には contract の型を使い、応答の型を手で書かない。
- 操作を送っている間は、そのボタンを無効にする。同じ操作を続けて送らせない。
- パスキーでのログインの最中(options を取ってから、ログインの応答が届くまで)は、ほかの管理用 API を呼ばない。
- 登録用 URL は `/enroll#{token}`。token は URL の `#` の後ろから読み、server に送るだけにする。登録したら、履歴から登録用 URL を消す(`replace`)。
- パスキーの追加と削除は、再認証(`src/features/auth/reauthenticate.ts`)の資格情報と一緒に送る。取り消せない操作は、確認の Dialog を出してから送る。
- 画面のテストは、`src/testing/render-app.tsx` で、作り物の server(`create-fake-api.ts`)と作り物の認証器につないだ管理画面の全体を描いて、利用者に見える結果で確かめる。`App` を通さずに部品だけを描くテストは、`src/testing/render-with-i18n.tsx` で、i18next の instance の下で描く。
- 画面に出す文言は、すべて `src/i18n/messages/` の訳から、react-i18next の `useTranslation` で引く。キーは英語の訳(`en.ts`)に足し、同じキーをほかの言語にも足す。引数は `{{name}}` で書き、どの言語も英語と同じ引数を持つ(テストで止まる)。引数を取らないキーを値として持つ型は、i18next の `ParseKeysWithoutVariables` にする。
- 言語を足すときは、`src/i18n/locales.ts` の `LOCALES` と、`src/i18n/resources.ts` の `RESOURCES` に足し、`messages/` にファイルを置く。
- 言語は i18next の `changeLanguage` で切り替える。html の `lang` と `localStorage` は、`sync-locale.ts` がそろえる。
- route の code splitting(`import()`)は使わない。`no-dynamic-import` はそのまま効かせる。
- 画面のコード(`src/ui/` と `src/features/*/ui/` の外)には、見た目の class を書かない。書けるのは `grow`・`shrink-0`・`min-w-0`・`truncate`・`sr-only` だけで、`className` は文字列のリテラルにし、`style` は書かない。並べ方・文字・色は `ui/` の部品の props で決める(lint で止まる)。
- 部品は、層の向き(patterns → primitives・layout)を守る。React Aria Components は `ui/primitives/` の中でだけ使い、`tv` は `ui/tv.ts` から import する(ここまでは lint で止まる)。primitives は自分の props の型を持ち、ライブラリの props の型を extends しない(lint では止まらないので、セルフレビューで見る)。
- 文字の役割は `Text`・`Heading` の `variant` で選ぶ。
- `ui/` の部品の class は、theme.css の役割だけで書く。止める class と理由は `src/ui/DECISIONS.md` の「検査」。止められたら、部品や役割を足すかを考え、`[…]` や抑制で逃げない。

## 開発とテスト

- 開発のサーバーは `bun --cwd=apps/admin run dev`(`http://localhost:5173`)。`/api` は server の外部用のポート(`http://localhost:8787`)へ流す。開くのは `localhost` で、`127.0.0.1` ではない(server の `AUTH_ORIGIN` とパスキーの RP ID に合わせる)。
- `src/` のテストは、リポジトリの直下の `bun test` からは外し、`apps/admin` の `bun test` で流す(`bun run test` は両方を流す)。`apps/admin/bunfig.toml` が DOM を用意してから流す。
- Vite の設定とビルドのテスト(`__tests__/`)は、DOM を用意しない直下の `bun test` で流す。

## セルフレビューの観点

- コンポーネントのテストが、決まった文言を描画して確かめるだけになっていないか。出し分けの条件ごとに、利用者に見える結果の違いを確かめているか。
- `.tsx` に、`.ts` へ切り出せるロジックが残っていないか。
- 画面に、訳を通さない文言を直接書いていないか。
- primitives の props の型に、React Aria Components の props の型を流用していないか。
