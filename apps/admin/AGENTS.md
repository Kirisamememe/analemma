# admin(Stilus、管理画面)

理由は同じフォルダの `DECISIONS.md` にある。デザインシステムの理由は `src/ui/DECISIONS.md` にある。

## 構成

- React + TanStack Router + TanStack Query の SPA。SSR しない。Vite でビルドし、server が同じ origin で静的ファイルとして配信する。
- `index.html`:Vite の入口。`vite.config.ts` の plugin が、`src/boot/boot.ts` を1つの script にまとめて head に書き込む(言語と配色を、最初の描画の前に当てる)。
- `src/main.tsx`:React を描き始める入口。
- `src/router.tsx`:route の木と、router を作る関数。route はコードで定義する(ファイルから route を作る仕組みは使わない)。
- `src/routes/`:route ごとの画面。
- `src/i18n/`:訳と言語。訳は `messages/` に言語ごとに1ファイル。
- `src/preferences/`:利用者が選ぶ言語と配色の、置き場所と値。
- `src/boot/`:最初の描画の前に流す script。
- `src/ui/`:デザインシステム(`theme.css` と部品)。
- `test-setup/`:管理画面のテストの前に読み込む、DOM の用意(happy-dom)。

## 書き方

- ロジックはできる限り `.ts` に置き、同じフォルダの `__tests__` に `.test.ts` を置いてテストする。`.tsx` にはマークアップと、それをロジックにつなぐコードを置く。
- ロジックに切り出しにくい表示の出し分けは、同じフォルダの `__tests__` の `.test.tsx` で確かめる。要素は role・label・text など利用者に見えるもので探し、利用者に見える結果を確かめる。マークアップの作りをなぞるテストは書かない。
- server との通信には contract の型を使い、応答の型を手で書かない。
- 操作を送っている間は、そのボタンを無効にする。同じ操作を続けて送らせない。
- パスキーでのログインの最中(options を取ってから、ログインの応答が届くまで)は、ほかの管理用 API を呼ばない。
- 登録用 URL(今は仮に `/enroll#{token}`)の画面を作る。token は URL の `#` の後ろから読み、server に送るだけにする。
- 画面に出す文言は、すべて `src/i18n/messages/` の訳から `useTranslation` で引く。キーは英語の訳(`en.ts`)に足し、同じキーをほかの言語にも足す。引数は `{name}` で書き、どの言語も英語と同じ引数を持つ(テストで止まる)。
- 言語を足すときは、`src/i18n/locales.ts` の `LOCALES` と、`src/i18n/translate.ts` の `TRANSLATIONS` に足し、`messages/` にファイルを置く。
- route の code splitting(`import()`)は使わない。`no-dynamic-import` はそのまま効かせる。

## 開発とテスト

- 開発のサーバーは `bun --cwd=apps/admin run dev`(`http://localhost:5173`)。`/api` は server の外部用のポート(`http://localhost:8787`)へ流す。開くのは `localhost` で、`127.0.0.1` ではない(server の `AUTH_ORIGIN` とパスキーの RP ID に合わせる)。
- `src/` のテストは、リポジトリの直下の `bun test` からは外し、`apps/admin` の `bun test` で流す(`bun run test` は両方を流す)。`apps/admin/bunfig.toml` が DOM を用意してから流す。
- Vite の設定とビルドのテスト(`__tests__/`)は、DOM を用意しない直下の `bun test` で流す。

## セルフレビューの観点

- コンポーネントのテストが、決まった文言を描画して確かめるだけになっていないか。出し分けの条件ごとに、利用者に見える結果の違いを確かめているか。
- `.tsx` に、`.ts` へ切り出せるロジックが残っていないか。
- 画面に、訳を通さない文言を直接書いていないか。
