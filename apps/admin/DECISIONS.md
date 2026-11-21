# 決めたことと理由(管理画面)

デザインシステムの判断は `src/ui/DECISIONS.md` にある。

## SPA にする

管理画面は検索エンジンに載せないので、SSR の利点が無い。Vite でビルドした静的ファイルにすれば、server から同じ origin で配信でき、Cookie と CORS の扱いも単純になる。

## 技術

| 役割           | 使うもの                                                     | 理由                                                                                                                                   |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 描画           | React 19                                                     | ユーザーが決めた。                                                                                                                     |
| route          | TanStack Router                                              | route の引数と検索の引数に型が付く。                                                                                                   |
| server の状態  | TanStack Query                                               | 取得・再取得・送信中の状態を、画面ごとに書かずに済む。                                                                                 |
| ビルド         | Vite 8                                                       | SPA の静的ファイルを作るだけなら、設定が一番少ない。                                                                                   |
| 見た目         | Tailwind CSS v4 + tailwind-variants                          | 理由は `src/ui/DECISIONS.md`。                                                                                                         |
| 部品の振る舞い | React Aria Components                                        | キーボードの操作・focus・ARIA を、部品ごとに自分で書かずに済む。shadcn/ui は使わない(ユーザーが決めた。見た目は自分たちの規則で持つ)。 |
| テストの DOM   | happy-dom(`@happy-dom/global-registrator`)と Testing Library | Bun の公式の案内にある組み合わせ。                                                                                                     |

## route はコードで定義する

TanStack Router の、ファイルから route を作る仕組み(`routeTree.gen.ts` を生成する plugin)は使わず、`src/router.tsx` で `createRoute` を組む。

- 生成するファイルは、整形・lint・用語集の検査から外す設定が要り、生成し忘れると型が古いまま残る。
- ファイルの名前に `__root.tsx`・`$id.tsx`・`_layout.tsx` のような形を求めるので、kebab-case の検査とぶつかり、route が増えると1つのフォルダに10件を超えて並ぶ。
- route の型(`Link` の `to` など)は、コードで組んでも同じように付く。型を登録する `declare module` の `interface Register` は、宣言のマージでしか書けないので、`consistent-type-definitions` をその1行だけ抑制している。

## code splitting はしない

route ごとの `lazy(() => import(…))` は使わず、`no-dynamic-import` をそのまま効かせる。管理画面を使うのは管理者1人で、全部を1つの bundle にしても大きくない(React と TanStack Router で約 300 KB、gzip で約 96 KB)。`import()` を許すと、境界を守る `no-restricted-imports` を動的な import ですり抜けられる(`tooling/DECISIONS.md`)。エディタのような大きなライブラリを入れるときに、決め直す。

## 言語と配色を最初の描画の前に当てる

html の `lang` と `data-theme` は、React が描き始める前に、`index.html` の head の script で当てる。React の中で当てると、利用者が OS と違う配色を選んでいたときに、最初の描画が OS の配色で出てから切り替わる。

- 当てる値は、`localStorage` に利用者が選んだ値があればそれ、無ければ言語はブラウザの言語の並びから選び、配色は OS に従う(`data-theme` を付けない)。決める関数(`src/boot/resolve-preferences.ts`)は純粋関数にしてテストする。
- script は `src/boot/boot.ts` を、`vite.config.ts` の plugin が、Vite の lib のビルドで1つの IIFE にまとめ、head に直接書き込む。TypeScript のまま書いてテストでき、`src/i18n/` と同じ言語の判定を使える。module の script は後回しに流れるので、最初の描画の前に流すには、module でない script にする必要がある。
- 外部のファイルにせず、head に直接書き込む。ファイルにすると、ビルドの出力の名前を head に書き戻す仕組みが要る。server が CSP の `script-src` を決めるときには、この script の hash を許すか、ファイルに分けるかを決める(server の「入口の守り」で、CSP のほかの directive は、管理画面の配信を足すときに決めることになっている)。
- React は、html の `lang` を読んで言語を決める(`src/i18n/locales.ts` の `toLocale`)。言語を決める出どころを、head の script の1か所にする。React Aria Components の `I18nProvider` にも、同じ値を渡す。
- 本番のビルドの出力で、head の script がアプリの script より前にあることと、作り物の `localStorage`・`navigator` の上で流すと値を当てることを、テスト(`__tests__/vite-config.test.ts`)で確かめる。ビルドの出力そのものを流すので、まとめ方を誤って module の構文が残れば落ちる。

## i18n

`en`・`ja`・`zh-Hans` を、フェーズ1から持つ(ユーザーが決めた)。繁体字などを足すときは、`LOCALES` と `TRANSLATIONS` に足し、`messages/` にファイルを置くだけにする。

- ライブラリを使わず、小さく自分で持つ。今の画面の文言は、引数を入れるだけで足りる。複数形や性の出し分けが要る文言が出てきたら、ICU の書き方を読めるライブラリにするかを決める。
- 訳は言語ごとに1ファイルで、キーは `"notFound.title"` のような1段のキーにする。入れ子にしないので、キーの一覧と型をそのまま比べられる。
- 英語の訳(`en.ts`)を `as const` で書き、キーと、`{name}` の引数の型を、英語の文字列から作る。ほかの言語は、英語のキーだけを持てる形(`Translation`)にし、訳していないキーは省ける。省けないと、キーを英語に足した時点で、ほかの言語を訳すまで型検査が通らない。
- 全部の言語が英語と同じキーと同じ引数を持ち、空の訳を持たないことを、テスト(`src/i18n/__tests__/messages.test.ts`)で確かめる。型で省けても、check を通る前に訳がそろう。
- それでも訳が無いキーは、英語にする(`pick-message.ts`)。訳しかけの開発の途中でも、画面が壊れない。
- 引数は `{name}` の形で、名前は英字で始まる英数字にする。訳の中の `{` と `}` は引数にだけ使えることも、テストで確かめる。型は `{` と `}` の間をそのまま名前として読むので、`{}` のような書き損じがあると、型と実行時で引数の読み方が食い違う。
- ブラウザの言語の並びから選ぶときは、`Intl.Locale` の `maximize()` で言語と文字の組にしてから比べる。`zh-CN`・`zh-SG`・`zh` は `zh-Hans`、`ja-JP` は `ja` になる。`zh-TW`・`zh-HK` は文字が違う(繁体字)ので、`zh-Hans` に寄せず、並びの次の言語に進む。どれも持たなければ英語にする。
- `Intl.Locale` が読めない tag(`i-klingon` など。BCP 47 では正しくても、Intl が受け付けないものがある)は、飛ばして次の言語に進む。head の script の中で throw すると、言語と配色のどちらも当たらなくなる(Codex のレビューで見つかった)。
- 利用者が選んだ言語と配色は、`localStorage` の `analemma:locale`・`analemma:theme` に置く。server には送らない。管理者は1人で、端末ごとに違ってよい。

## 開発のときの API

開発では、Vite の開発のサーバー(`http://localhost:5173`)が、`/api/` で始まるパスを server の外部用のポート(`http://localhost:8787`)へ流す。

- ブラウザから見ると、管理画面と API は同じ origin になる。server は、`admin` と `auth` の procedure で、GET でなければ Origin が `AUTH_ORIGIN` と完全に一致することを、GET を含めて、ブラウザが `Sec-Fetch-Site` を付けたらそれが `same-origin` であることを確かめる(`apps/server/DECISIONS.md` の「入口の守り」)。Vite は Origin・`Sec-Fetch-Site`・Host をそのまま流し、server の `Set-Cookie` もそのまま返すので、server の `.env.example` の `AUTH_ORIGIN`(`http://localhost:5173`)のままで通る。`changeOrigin` は使わない。この振る舞いは、作り物の server を立てたテスト(`__tests__/vite-config.test.ts`)で確かめる。
- 流すのは `/api/` で始まるパスだけにする(`^/api/`)。Vite は文字列のキーを前方一致で比べるので、`/api` と書くと `/api-guide` のような画面のパスまで server へ流れる。
- 開発のサーバーの origin が `AUTH_ORIGIN` と食い違うと、すべてのログインが 403 になるので、`vite.config.ts` の origin と server の `.env.example` の `AUTH_ORIGIN` が同じことを、テストで確かめる。ポートが空いていなければ、別のポートに移らずに止まる(`strictPort`)。
- `127.0.0.1` で開くと、origin が `AUTH_ORIGIN` と食い違い、RP ID(`localhost`)ともずれるので、`localhost` で開く。
- 本番のビルドを確かめる `vite preview` も、開発のサーバーと同じ origin(`http://localhost:5173`)とプロキシにする。preview は既定では別のポート(4173)で開くのに、開発のプロキシをそのまま引き継ぐ。origin が `AUTH_ORIGIN` と食い違うと POST は断られる一方、Cookie はポートを区別しないので、開発でログインした Cookie で GET は通ってしまう(Codex のレビューで見つかった)。2つは同時には動かせない。
- 公開 API とデプロイ用 API は、管理画面からは呼ばない。server が内部用のポートを持ったら(server の PR で足す)、そちらで受けるので、開発のプロキシからも届かなくなる。

## テスト

マークアップの作りをなぞるだけのテストは書かない。実装をなぞるテストは、実装を変えるたびに直すだけで、何も守らない。

- ロジックはできる限りマークアップから分けて `.ts` に置き、テストを必ず書く。`.ts` から React を import できないようにして、`.ts` をテストできるロジックだけにする。
- ロジックに切り出しにくい出し分けは、コンポーネントのテストで確かめる。要素は role・label・text など利用者に見えるもので探し、利用者に見える結果を確かめる。test id、DOM のたどり方、クラス名、スナップショットのように、マークアップの作りに依存する探し方と確かめ方は使わない。
- 出し分けの無いコンポーネントには、テストを求めない。
- 決まった文言を描画して確かめるだけのテストは lint を通ってしまうので、セルフレビューで見る。
- 管理画面の `src/` のテストは、リポジトリの直下の `bun test` から外し(直下の `bunfig.toml`)、`apps/admin` で別に流す(`apps/admin/bunfig.toml` の `root` を `src` にする)。DOM(happy-dom)を用意する preload を、画面のコードのテストにだけ掛けるため。happy-dom は `fetch`・`Request`・`Response`・`setTimeout` などのグローバルを置き換えるので、直下で掛けると server のテストまで happy-dom の上で流れる。`bunfig.toml` は、`bun test` を流すフォルダのものだけが読まれる(手元で確かめた)。
- Vite の設定とビルドのテスト(`apps/admin/__tests__/`)は、直下の `bun test` で、DOM なしで流す。Vite は Node の `setTimeout` を前提にしていて(`unref()` を呼ぶ)、happy-dom の上では開発のサーバーが起動しない。
- tsconfig を2つに分ける。`tsconfig.app.json` は、テストを除いた `src/` を、Bun の型なしで検査する(画面のコードが Bun の API の型を読めないように)。`tsconfig.json` は、テスト・`vite.config.ts`・`test-setup/` を含めて Bun の型で検査し、型付きの lint もこちらを使う。

## server の認証に合わせること

server の判断は `apps/server/src/features/auth/DECISIONS.md` にある。

- **送信中はボタンを無効にする**:パスキーの削除などを続けて送ると、先のリクエストで成功しても、後のリクエストが失敗を返すことがある(使い切った再認証の資格情報、消えたセッションなど)。server ではそろえないので、画面の表示と結果が食い違わないよう、送らせない。
- **ログインの最中に、ほかの管理用 API を呼ばない**:期限を延ばした応答と、ログインし直した応答が逆の順で届くと、新しい Cookie が古い token で上書きされうる。server では防がないので、ログインの最中に、期限を延ばしうるリクエストを送らない。
- **登録用 URL の画面**:最初の登録と復旧は、server のコマンドが出す登録用 URL で行う。token を `#` の後ろに置くのは、server のアクセスログや Referer に残さないため。画面は、token を読んで options を取り、パスキーを作らせて登録する。URL の形は仮で、この画面を作るときに決める。

## 割り切ったこと

- **開発のときの head の script**:開発のサーバーは、HTML を返すたびに、head の script を Vite の lib のビルドでまとめ直す(数十ミリ秒)。覚えておくと、`src/boot/` を直したときに開発のサーバーを起動し直す必要がある。待ち時間が気になったら、依存が変わったときだけまとめ直す形にする。
- **`localStorage` が使えないブラウザ**:head の script は、`localStorage` を読めないと(ストレージを切った設定など)throw し、言語と配色を当てずに終わる。React は html の `lang` が無ければ英語にするので、画面は英語で出る。管理者が自分のブラウザで使うだけなので、受け入れる。
