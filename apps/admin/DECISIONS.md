# 決めたことと理由(管理画面)

デザインシステムの判断は `src/ui/DECISIONS.md` にある。

## SPA にする

管理画面は検索エンジンに載せないので、SSR の利点が無い。Vite でビルドした静的ファイルにすれば、server から同じ origin で配信でき、Cookie と CORS の扱いも単純になる。

## 技術

| 役割           | 使うもの                                                     | 理由                                                                                                                                   |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 描画           | React 19                                                     | ユーザーが決めた。                                                                                                                     |
| route          | TanStack Router                                              | path params と search params に型が付く。                                                                                              |
| server の状態  | TanStack Query                                               | 取得・再取得・送信中の状態を、画面ごとに書かずに済む。                                                                                 |
| ビルド         | Vite 8                                                       | SPA の静的ファイルを作るだけなら、設定が一番少ない。                                                                                   |
| 見た目         | Tailwind CSS v4 + tailwind-variants                          | 理由は `src/ui/DECISIONS.md`。                                                                                                         |
| 部品の振る舞い | React Aria Components                                        | キーボードの操作・focus・ARIA を、部品ごとに自分で書かずに済む。shadcn/ui は使わない(ユーザーが決めた。見た目は自分たちの規則で持つ)。 |
| テストの DOM   | happy-dom(`@happy-dom/global-registrator`)と Testing Library | Bun の公式の案内にある組み合わせ。                                                                                                     |
| i18n           | i18next 27 + react-i18next                                   | ユーザーが決めた。理由は「i18n」。                                                                                                     |

## import の別名

管理画面では `@/ui/...` のように、`@/` を `src/` の起点として使う。離れたフォルダを参照する import でも、ファイルを移すたびに `../` の段数を直さずに済む。別名は `tsconfig.json`(テストを含め、Bun の型で検査する。Bun のテストもこの `paths` で解決する)と `tsconfig.app.json`(テストを除き、ブラウザ向けに検査する)の `paths` の両方に置き、どちらでも同じ import を書けるようにする(ユーザーが決めた)。

Vite は `resolve.tsconfigPaths` で `paths` を読み、本番のビルド・開発のサーバー・head の script をまとめるビルドで同じ別名を解決する。Storybook は管理画面の Vite の設定から `resolve` を引き継ぐ。Vite は `include` に当たるファイルにだけ `paths` を効かせる。Storybook の preview とその部品からも別名を使えるよう、`tsconfig.json` の `include` には、フォルダ名の `.storybook` ではなく `.storybook/**/*` を書く(フォルダ名だけでは、`story-frame.tsx` から別名を解決できなかった)。

## フォルダを指定する import

認証器の組み立てと型を使うコードは `@/features/auth/webauthn` から、ログアウトのボタン・hook・すべてのセッションからログアウトする欄を使うコードは `@/features/session` から、言語と配色の選択を使うコードは `@/features/preferences` から import する。フォルダの外で使うものを `index.ts` に明示しておくと、中のファイルの名前や分け方を変えても、呼び出し元を直さずに済む。フォルダの中のコードと、それぞれの実装を確かめるテストは、対象のファイルを直接 import する。

`App` と `createApp` は `src/app/` に置く。どちらも API・router・言語などを組み合わせるため、組み立てに関わるコードを同じ場所に置き、外からは `@/app` を使う。

## 複数の feature から使う部品

複数の feature から使う、管理画面に固有の部品は `src/components/` に置き、`@/components/...` から import する。パスキーの名前の入力欄のように、管理画面の訳と contract の検査を持つ部品を、ラベルや検査を呼び出し元から受け取る `src/ui/` の部品と分ける。`components/` は features を import しない。利用する feature 同士が、部品を通じて依存し合わずに済む。

## hook・純粋な関数・server の API を呼ぶ処理の置き場所

`features/`・`components/`・`ui/` では、ファイルを役割ごとのフォルダに分ける(ユーザーが決めた。`project/admin-module-location` で止まる)。部品と、それと一緒に変わる処理を同じ場所からたどれ、フォルダの名前で、React なしでテストできるものと server を呼ぶものが分かる。

- hook は、使う部品に近い `hooks/` に置く。
- 純粋な関数(値の検証・変換・知らせの選び分けなど)は、使う部品に近い `logic/` に置く。
- server の API を呼ぶ処理(読み込み・書き込み・query のキー)は、feature の中の、使う部品に近い `queries/` に置く。feature の中の複数の部品が使うときだけ、どの部品からも近い `queries/` に上げる。複数の feature が使う再認証(パスキーとデプロイ用のトークンが使う)だけは、`src/queries/` に置く。
- 純粋な関数でも server の API を呼ぶ処理でもない `.ts`(ログインの gate・WebAuthn のブラウザでの処理・クリップボードへの書き込み・固定ページの repeat の要素に ID を振ってフォームの最初の値を作る処理、最初の誤りの欄までスクロールして focus を移す処理)は、今の場所に置き、lint の設定の `effectfulModules` に足す。どれも、呼び出しのあいだ状態を持つ・ブラウザの API を呼ぶ・渡された関数で外に書き込む・`crypto.randomUUID()` で ID を作るのどれかで、同じ入力に同じ値を返すとは限らない。`logic/` に入れると、純粋な関数だけを置く約束が崩れる。
- `src/queries/` を足すと `src/` の中身が10件を超えるので、React を描き始める入口(`main.tsx`)を `src/app/` に移した。`App` と `createApp` と同じく、組み立てに関わるコードを `src/app/` にまとめる(「フォルダを指定する import」)。

## route はコードで定義する

TanStack Router の、ファイルから route を作る仕組み(`routeTree.gen.ts` を生成する plugin)は使わず、`src/app/router.ts` で `createRoute` を組む。

- 生成するファイルは、整形・lint・用語集の検査から外す設定が要り、生成し忘れると型が古いまま残る。
- ファイルの名前に `__root.tsx`・`$id.tsx`・`_layout.tsx` のような形を求めるので、kebab-case の検査とぶつかり、route が増えると1つのフォルダに10件を超えて並ぶ。
- route の型(`Link` の `to` など)は、コードで組んでも同じように付く。型を登録する `declare module` の `interface Register` は、宣言のマージでしか書けないので、`consistent-type-definitions` をその1行だけ抑制している。

## code splitting はしない

route ごとの `lazy(() => import(…))` は使わない。管理画面を使うのは管理者1人で、全部を1つの bundle にしても大きくない(i18next を足した今の bundle で約 710 KB、gzip で約 224 KB)。分ける得が無い間は、分けない。エディタのような大きなライブラリを入れるときに、決め直す。そのときは、`import()` を書く場所(route を組むファイル)を決め、`no-dynamic-import` をそこでだけ理由付きで抑制する。

## 対応するブラウザ

最新の Chrome と WebKit だけで動けばよい。古いブラウザには対応せず、Firefox にも必要以上に合わせない(ユーザーが決めた)。新しい CSS・HTML・JS の API は、出てから日が浅くても、UI/UX に役立つなら使う。

- Vite の `build.target` と `build.cssTarget` を `esnext` にし、古いブラウザのための書き換えをさせない(最初の描画の前に流す script のビルドも同じ)。`modulePreload` の polyfill も入れない。
- Storybook の Vite にも、同じ対象を入れる(`.storybook/adapt-vite-config.ts`。Storybook は `vite.config.ts` の `build` を `target` しか引き継がない)。

## 言語と配色を最初の描画の前に当てる

html の `lang` と `data-theme` は、React が描き始める前に、`index.html` の head の script で当てる。React の中で当てると、利用者が OS と違う配色を選んでいたときに、最初の描画が OS の配色で出てから切り替わる。

- 当てる値は、`localStorage` に利用者が選んだ値があればそれ、無ければ言語はブラウザの言語の並びから選び、配色は OS に従う(`data-theme` を付けない)。決める関数(`src/preferences/resolve-preferences.ts`)は純粋関数にしてテストする。
- script は `src/preferences/boot.ts` を、`vite.config.ts` の plugin が、Vite の lib のビルドで1つの IIFE にまとめ、head に直接書き込む。TypeScript のまま書いてテストでき、`src/i18n/` と同じ言語の判定を使える。module の script は後回しに流れるので、最初の描画の前に流すには、module でない script にする必要がある。
- 最初の描画の前に別のファイルを取りに行かずに済むよう、script は head に直接書き込む。server は起動時にビルド済みの `index.html` の、src の無い script の本文から hash を求め、CSP の `script-src` に含める。
- React は、html の `lang` を読み(`src/i18n/locales.ts` の `toLocale`)、i18next の `lng` に渡す。言語を決める出どころを、head の script の1か所にする。i18next の language detector は使わない。
- 言語の切り替えは i18next の `changeLanguage` で行い、画面を読み込み直さない。`languageChanged` の event で、html の `lang` と `localStorage` を同じ値にする(`src/preferences/sync-locale.ts`)。html の `lang` は、theme.css の `:lang()` による、言語ごとの字体の切り替えに効く。`useTranslation` を使う部品は、切り替えのたびに描き直されるので、React Aria Components の `I18nProvider`(`UiProvider`)にも、i18next の今の言語が渡る。React Aria Components の辞書は、文字体系ではなく地域で分かれていて(`zh-CN`・`zh-TW`)、`zh-Hans` を渡すと、`zh-` で始まる辞書のうち、並びが先のものを使う。並びに頼らないよう、地域を付けた言語(`zh-CN` など)にして渡す。instance を作ったときの言語は `localStorage` に置かない。head の script がブラウザの言語から選んだ値なので、置くと、ブラウザの言語を変えても追従しなくなる。
- 本番のビルドの出力で、head の script がアプリの script より前にあることと、作り物の `localStorage`・`navigator` の上で流すと値を当てることを、テスト(`__tests__/vite-config.test.ts`)で確かめる。ビルドの出力そのものを流すので、まとめ方を誤って module の構文が残れば落ちる。

## 言語と配色の切り替え

利用者は、ナビの下の段(ログアウトの上)で、言語と配色を切り替える。広い画面のナビと、狭い画面の引き出したナビの両方に置く。部品の形と見た目の理由は `src/ui/DECISIONS.md` の「ナビの選択」にある。

- 言語の選択肢は、それぞれの言語で書いた名前(English・日本語・简体中文)にする。画面の言語が読めなくても、自分の言語を見つけられる。名前は、ブラウザの `Intl.DisplayNames` で、その言語自身の名前を引く(`src/i18n/locales.ts` の `localeName`)。訳に書くと、どの言語の訳にも同じ名前を写すことになり、言語を足すたびに3か所を直す。
- 言語は、i18next の `changeLanguage` で切り替える(`src/i18n/use-change-locale.ts`)。html の `lang` と `localStorage` は、今までどおり `syncLocale` がそろえる。features は i18next を直接 import できないので、hook で包む。
- 配色は「自動」(OS に従う)・ライト・ダークの3つ。「OS に合わせる」は長く、かえって分かりにくいので、「自動」にした(ユーザーが決めた)。
- 今の配色の出どころは、html の `data-theme` にする(`src/preferences/use-theme.ts`)。最初の描画の前に head の script が当てた値を、そのまま読める。`useSyncExternalStore` で読み、`MutationObserver` で `data-theme` の書き換えを追うので、広い画面と引き出したナビの2つの選択が、同じ値を出す。Storybook のツールバーが当てた配色も、そのまま出す。React の state に持つと、2つのナビの選択の値が食い違う。
- 選んだ配色は、html の `data-theme` に当ててから、`localStorage` に置く。当てる処理(`src/preferences/apply-theme.ts`)は、head の script と共有する。自動を選んだら `data-theme` を外し、`localStorage` には `system` を置く(置いていないときと同じく、OS に従う)。

## Zod に検査のコードを作らせない

`src/main.tsx` の最初の import で `src/app/zod-config.ts` を読み込み、`z.config({ jitless: true })` にする(エージェントが決めた)。

- Zod 4 は、object のスキーマを作るときに `new Function` を使えるかを試し、使えれば、検査のコードを作って速くする。server が外部用のポートで管理画面を配るときの CSP は `unsafe-eval` を許さない(`apps/server/DECISIONS.md`)ので、試しは失敗する。Zod は失敗を捕まえて、コードを作らずに検査するので、検査の結果は変わらないが、ブラウザは CSP の違反として console に出す。`jitless` にすると、Zod は試さない。管理画面が検査するのは、フォームの値やパスキーの応答のような小さな値なので、コードを作らなくても遅さは分からない。
- 試しはスキーマを作るときに走るので、contract のスキーマを作る前に設定を当てる。ES module は、import を書いた順に評価するので、`main.tsx` の最初の import にする。整形(oxfmt)の import の並べ替えは、副作用だけの import を動かさない(確かめた)。
- 設定を当てると、その後に作ったスキーマの検査で `new Function` を使わないことを、テスト(`src/app/__tests__/zod-config.test.ts`)で確かめる。管理画面は、設定のために zod を直接の依存に持つ。

## i18n

`en`・`ja`・`zh-Hans` を、フェーズ1から持つ(ユーザーが決めた)。繁体字などを足すときは、`LOCALES` と `RESOURCES`(`src/i18n/resources.ts`)と、React Aria Components に渡す地域を付けた言語(`src/ui/primitives/ui-provider.tsx` の `ARIA_LOCALES`)に足し、`messages/` にファイルを置くだけにする。

訳を引くのは、i18next 27 と react-i18next にする(ユーザーが決めた)。コードの生成も、訳を取りに行く通信も要らず、v27 からキーと引数に厳しく型が付き(`strictInterpolationChecks` が既定で有効)、複数形と fallback を扱える。公開サイトの i18n は、公開サイトを作るときに決める。

- 訳は言語ごとに1ファイルの TypeScript で書き、英語の訳(`en.ts`)は `as const` で書く。JSON を import すると、TypeScript が訳を `string` に広げるので、i18next の型が引数の名前を読めない。英語の訳を `CustomTypeOptions` の `resources` に登録し(`resources.ts`)、キーと引数の型の出どころにする。`strictKeyChecks` も有効にし、`t` に `defaultValue` を渡したときも、キーと引数を確かめる(既定では、`defaultValue` を渡すと確かめない)。訳に無いキーと引数の渡し忘れが型の誤りになることは、`@ts-expect-error` を書いたテスト(`create-i18n.test.ts`)で確かめる。型の登録が外れると、`@ts-expect-error` の方が型検査で落ちる。ほかの言語は、英語のキーだけを持てる形(`Translation`)にし、訳していないキーは省ける。省けないと、キーを英語に足した時点で、ほかの言語を訳すまで型検査が通らない。
- キーは `"notFound.title"` のような1段のキーにし、`keySeparator` と `nsSeparator` を、実行時と型の両方で `false` にする。`.` を入れ子の区切りとして読まないので、キーの一覧と型をそのまま比べられる。namespace は既定の1つだけを使う。
- 引数は i18next の既定の `{{name}}` で書く。全部の言語が英語と同じキーと同じ引数を持ち、空の訳を持たないことを、テスト(`src/i18n/__tests__/messages.test.ts`)で確かめる。型で省けても、check を通る前に訳がそろう。訳の中の `{` と `}` は、英字で始まる名前の引数 `{{name}}` にだけ使えることも確かめる。`{name}` のような書き損じは、i18next にも型にも引数と読まれず、そのまま画面に出る。
- 複数形は、`key_one`・`key_other` のキーに分け、`count` を渡す(i18next が `Intl.PluralRules` で選ぶ)。言語ごとに複数形の分け方(CLDR の plural category)が違う(日本語は `other` だけ)ので、複数形の訳を足すときは、キーを比べるテストを、その言語の分け方に合わせて直す。
- `fallbackLng` を英語にし、訳が無いキーと空の訳を英語で出す(v27 から、既定では fallback しない。空の訳を訳が無いとみなすのは v27 の既定)。訳しかけの開発の途中でも、画面が壊れない。
- `supportedLngs` に `LOCALES` を渡す。i18next は、対応していない tag を、言語の部分(`zh` など)が同じ、対応する言語に寄せ(`zh-TW` も `zh-Hans` になる)、それも無ければ英語にする。ブラウザの言語の並びから選ぶときの判定(下)とは違うので、`changeLanguage` には `LOCALES` の値だけを渡し、ブラウザの言語を渡さない。
- React が値を escape するので、i18next の escape は切る(`escapeValue: false`)。二重に escape すると、`&` が `&amp;` のまま画面に出る。
- 訳は bundle に入れ、instance を作るときに渡す。読み込みを待たないので、`init` と `changeLanguage` はその場で終わり、features の `useTranslate` と `src/routes/` の `useTranslation` が Suspense で止まらない。
- instance は、言語を受けて `createInstance` で作る(`src/i18n/create-i18n.ts`)。訳は instance ごとに `structuredClone` で複製して渡す。i18next は渡した object をそのまま store にし、`addResource` などで書き換えるので、複製しないと、ある instance(テストや story)で書き換えた訳が、ほかの instance に漏れる。i18next の既定の instance と `initReactI18next` は使わず、`I18nextProvider` で渡す(`App`)。テストや Storybook が、描くたびに別の言語の instance を作れる。`App` を通さずに部品だけを描くテストは、`src/testing/render-with-i18n.tsx` で、i18next の instance の下で描く。
- 日付と時刻は、i18next の formatting を使わず、`Intl.DateTimeFormat` の関数(`format-date-time.ts`)に、i18next の今の言語を渡して書く。書式(`dateStyle: medium`・`timeStyle: short`)は画面の決めごとで、言語ごとに変えない。formatting にすると、全部の言語の訳に `{{created, datetime(dateStyle: medium; timeStyle: short)}}` のような書式を写すことになり、API が返す ISO 8601 の文字列を `Date` に直す手間も要る。
- 英語の訳を `as const` で書くので、i18next や `useTranslation` から直接取る `t` の戻り値の型は、英語の訳の文字列のリテラルになる。実行時には今の言語の訳が返るため、`useTranslate` では戻り値の型を `string` にする。i18next の `t` の戻り値をテストで英語以外の文字列と比べるときは、`expect<string>` で `string` に広げる。
- features で引数を取らないキーを値として持つ型(知らせの訳のキーなど)は、`useTranslate` が返す `t(key)` にそのまま渡せる `MessageKey` にする。出どころは i18next の `ParseKeysWithoutVariables`。ただし、複数形の形(`key_one`・`key_other`)だけを持ち、どの形も引数を取らないキーも受け付ける。`count` を渡さずに引くと、訳ではなくキーがそのまま返る(`{{count}}` を含む形があれば、型の誤りになる)。知らせに複数形を使うときは、`count` も渡せる形にする。
- ブラウザの言語の並びから選ぶときは、`Intl.Locale` の `maximize()` で言語と文字体系の組にしてから比べる。`zh-CN`・`zh-SG`・`zh` は `zh-Hans`、`ja-JP` は `ja` になる。`zh-TW`・`zh-HK` は文字体系が違う(繁体字)ので、`zh-Hans` に寄せず、並びの次の言語に進む。どれにも対応していなければ英語にする。
- `Intl.Locale` が読めない tag(`i-klingon` など。BCP 47 では正しくても、Intl が受け付けないものがある)は、飛ばして次の言語に進む。head の script の中で throw すると、言語と配色のどちらも当たらなくなる(Codex のレビューで見つかった)。
- 利用者が選んだ言語と配色は、`localStorage` の `analemma:locale`・`analemma:theme` に置く。server には送らない。管理者は1人で、端末ごとに違ってよい。

## React の effect

`useEffect`・`useLayoutEffect`・`useInsertionEffect` は、ほかの手段で書けない処理を、目的が分かる名前の hook にまとめ、その直下で使う。React の外と同期する処理を hook にまとめると、呼ぶ側から何と同期するかが分かり、どこで effect を使うかを hook の表で見られる。

effect でないと書けない処理は、次のとおり。

1. `window`・`document` のイベントを購読し、外すまで持ち続ける処理(キーボードの shortcut、`beforeunload`)。
2. component が生きている間の timer。
3. DOM の要素に結びつかない外への接続(WebSocket・EventSource・BroadcastChannel)。
4. React の外の状態のうち、`document.title` や html の属性のように、React が描かない DOM に値を書く処理。
5. ブラウザが描く前の大きさの計測(`useLayoutEffect`)。

それ以外は、次の手段で書く。

| 処理                               | 使う手段                                                |
| ---------------------------------- | ------------------------------------------------------- |
| DOM の要素に結びつく準備と後片付け | cleanup を返す ref callback                             |
| 外の store の値の読み取り          | `useSyncExternalStore`                                  |
| props や state から計算できる値    | 描くときに計算し、重ければ `useMemo`                    |
| 操作がきっかけの処理               | event handler や mutation の `onSuccess`                |
| 子の state を作り直す              | `key`                                                   |
| データの読み込み                   | 画面の中で TanStack Query を使う                        |
| 初期化                             | `main.tsx` か module の一番外                           |
| effect の中で最新の値を読む        | `useEffectEvent`                                        |
| URL の履歴を画面の値に合わせる     | Router の `Navigate`(登録用 URL の画面)                 |
| i18next の言語を props に合わせる  | 言語ごとに instance を `useMemo` で作る(Storybook の枠) |
| 画面を離れる前の確かめ             | Router の `useBlocker`(`src/api/leave-confirmation.ts`) |

effect を使う hook の表は、次のとおり。

| hook                     | 置き場所                                            | 処理                                                                                  |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `useHtmlPreferences`     | `.storybook/use-html-preferences.ts`                | (4) ブラウザが描く前に html の `lang` と `data-theme` を story の値に合わせる         |
| `useLoadingAnnouncement` | `src/ui/patterns/hooks/use-loading-announcement.ts` | (2) 空の通知欄を先に置き、150ms 続いた読み込みを伝える。欄が消えたら timer を止める。 |

表の hook は `tooling/lint/config/admin-overrides.ts` の `ADMIN_EFFECT_HOOKS` にも足す。どうしても避けられない呼び出しを表の hook の外に書く場合は、`// oxlint-disable-next-line project/no-effect-outside-allowed-hook -- 理由` で抑制する。

## 開発のときの API

開発では、Vite の開発のサーバー(`http://localhost:5173`)が、`/api/` と `/media/`(配信用の画像)で始まるパスを server の外部用のポート(`http://localhost:8787`)へ流す。

- ブラウザから見ると、管理画面と API は同じ origin になる。server は、`admin` と `auth` の procedure で、次を確かめる(`apps/server/DECISIONS.md` の「入口の守り」)。GET 以外では、Origin が `AUTH_ORIGIN` と完全に一致すること。GET も含め、`Sec-Fetch-Site` が `same-origin` であること(無いリクエストも断る)。Vite は Origin・`Sec-Fetch-Site`・Host をそのまま流し、server の `Set-Cookie` もそのまま返すので、server の `.env.example` の `AUTH_ORIGIN`(`http://localhost:5173`)のままで通る。`changeOrigin` は使わない。この振る舞いは、作り物の server を立てたテスト(`__tests__/vite-config.test.ts`)で確かめる。
- 流すのは `/api/` と `/media/` で始まるパスだけにする(`^/(?:api|media)/`)。Vite は文字列のキーを前方一致で比べるので、`/api` と書くと `/api-guide` のような画面のパスまで server へ流れる。
- 開発のサーバーの origin が `AUTH_ORIGIN` と食い違うと、すべてのログインが 403 になるので、`vite.config.ts` の origin と server の `.env.example` の `AUTH_ORIGIN` が同じことを、テストで確かめる。ポートが空いていなければ、別のポートに移らずに止まる(`strictPort`)。
- `127.0.0.1` で開くと、origin が `AUTH_ORIGIN` と食い違い、RP ID(`localhost`)ともずれるので、`localhost` で開く。
- 本番のビルドを確かめる `vite preview` も、開発のサーバーと同じ origin(`http://localhost:5173`)とプロキシにする。preview は既定では別のポート(4173)で開くのに、開発のプロキシをそのまま引き継ぐ。origin が `AUTH_ORIGIN` と食い違うと POST は断られる一方、Cookie はポートを区別しないので、開発でログインした Cookie で GET は通ってしまう(Codex のレビューで見つかった)。2つは同時には動かせない。
- 公開 API とデプロイ用 API は、管理画面からは呼ばない。server が内部用のポートを持ったら(server の PR で足す)、そちらで受けるので、開発のプロキシからも届かなくなる。

## server の API の呼び方

- server の API は、contract の型を付けた oRPC の client(`src/api/create-api-client.ts`)で、同じ origin の `/api` に、oRPC のプロトコルで呼ぶ。応答の型を手で書かない。
- server の状態は TanStack Query で持つ。query client(`src/api/create-query-client.ts`)は、取得と送信のどちらかがセッションの無いこと(`UNAUTHORIZED`)を返したら、持っている状態を消して、ログインの画面に、今のパスを持たせて移す。セッションの無い失敗は、やり直さない。
- 画面に focus が戻っても、取り直さない(`refetchOnWindowFocus: false`)。パスキーの操作は OS の画面を開くので、ログインの最中に focus が出入りし、取り直すと、ログインの最中にほかの管理用 API を呼ぶことになる(「server の認証に合わせること」)。
- server のデータ(取得と送信の結果)は、使う画面が無くなったらすぐに捨て、画面をまたいでメモリに持たない(ユーザーが決めた)。query client の既定の `gcTime` を 0 にし、取得の途中で使う画面が無くなったときも、query cache から取り除いて取得を取り消す。TanStack Query は、取得の途中のデータを捨てないので、前の値を持ったまま取り直している一覧を、開き直したときに前の値で描いてしまう。取り除くのは次の tick で、まだ使う画面が無いことを確かめてからにする。開発のときの React の StrictMode は、購読を外してすぐ付け直すので、すぐ取り除くと使っている取得を捨てる。server のデータは画面ごとの状態で、全体で持ち回る状態ではない。前は TanStack Query の既定どおり5分持ち、画面を開き直したときにまず描いていたので、ほかの端末ですべてのセッションからログアウトした後も、開き直した一覧が、セッションの確認が届くまで前のデータで出た。送信の結果(`useApiMutation` の `data`)も、画面を閉じた後に5分残っていた。画面を開き直したときは、いつも読み直す。送った操作の応答に新しい値があるときは、`useApiCache` の `replace` で、送っている取得を中断してから差し替える。
- `useApiCache` の `refresh` は、使う画面の無い取得も取り直す(`refetchType: "all"`)。使う画面の無い取得は捨てるので、取り直すのは、終わっていない取得と、送った操作の後に同じ画面が描き続ける取得になる。取り直しが届くまで、送った操作は送信中のままになる。
- 送信の失敗は、やり直さない。登録やログインを2回送ると、使い切った challenge で失敗する。
- 送信と取得は、オフラインでも保留せずに送り、失敗をその場で返す(`networkMode: "always"`)。TanStack Query の既定では、オフラインのときの送信を保留し、つながったときに確かめずに送る(すべてのセッションからのログアウトなどが、利用者の知らないうちに送られる。Codex のレビューで見つかった)。取得も保留すると、送信の後に一覧を取り直す処理が待ったままになり、送信が終わらない(Copilot のレビューで見つかった)。

## features の依存

features のビジネスロジックを外のライブラリから独立させるため、features の外部依存を減らす(ユーザーが決めた)。ライブラリを差し替えるときに調べて直す場所を限るために、外のライブラリへの依存を `src/i18n/` と `src/api/` に集める。差し替えへの備えは、抽象化の層を増やすのではなく、依存の場所を限ることで担保する。

- features に渡すのは、今使う操作と値に絞る。ライブラリの型を返したり、名前を変えて出し直したりすると、呼び出し側もライブラリの型や振る舞いに依存するため。
- query のキーと、server の API を呼ぶ操作の中身は features が持つ。複数の feature が使うもの(再認証)だけは `src/queries/` に置く(「hook・純粋な関数・server の API を呼ぶ処理の置き場所」)。パスキーなど、feature 専用の hook を `src/api/` に置くと、feature のロジックを呼ぶために `src/api/` が features を import し、依存の向きが逆になる。`src/queries/reauthenticate.ts` は、認証器の型だけを `@/features/auth/webauthn` から `import type` する。型だけなので、実行時には features に依存しない。
- ナビには、今いる画面へのリンクかを返す関数を渡す。`SignedInLayout` が既存の route の組み立てと一緒に `useMatchRoute` を使うので、ナビのリンクは同じ照合を使える。
- `callApi` は呼び出し側が扱う code だけを `Failed` で返し、ほかの失敗は元の error を throw する。セッション切れを表す `UNAUTHORIZED` を query client に届け、ログインの画面への移動を query client に任せるため。
- `useApiMutation` は、送信か送信後の処理が想定外の失敗で終わったら `onError` を呼ぶ。操作の失敗を、Dialog の中で送ったものも外で送ったものも、Toast で知らせるため。セッション切れ(`UNAUTHORIZED`)では呼ばない。query client がログインの画面に移すので、閉じるまで残る失敗の Toast を、ログインの画面に持ち越さない。
- `useApiMutation` は `send` の Promise が resolve したら `onSuccess` を呼ぶ。もう無いパスキーを操作したときの `NotFound` など、操作が断られた結果も `onSuccess` に渡り、その処理が完了すると `data` に入る。`send` や `onSuccess` が error で終わると `isError` が立つ。同じ操作を続けて送らせないよう、`onSuccess` の処理が終わるまで `isPending` を保つ。
- 取得に失敗したら、`useApiQuery` の `Failed` が返す `retry` で取り直す。TanStack Query は、データの無い取得を取り直すと pending に戻すが、前に失敗していたら(`errorUpdateCount`)、取り直している間も `Failed` を返し、`isRetrying` を立てる。`isRetrying` は、取得が終わるまで(`fetchStatus` が `idle` に戻るまで)立てる。TanStack Query は、画面が隠れている間の次の試行を一時停止し(`paused`)、その間は `isFetching` が false になるので、`isFetching` で見ると一時停止を失敗と取り違える。Loading に戻すと、読み込めなかった欄が「読み込んでいます」に替わり、押したボタンと送信中の表示が消える。画面を開き直したときは、前の取得の結果を捨ててあるので、成功でも失敗でも、読み込み中から始まる。
- 再取得に失敗したときは `useApiQuery` が `Failed` を返す。前のデータを表示すると、再取得できたように見えるため。
- cursor で続きを読む一覧(画像)は、`useApiInfiniteQuery`(`src/api/server-state/use-api-infinite-query.ts`)で TanStack Query の infinite query を包む。features は TanStack Query を直に使えないため。最初のページの失敗と取り直しの失敗は `useApiQuery` と同じく `Failed` にし、続きのページだけの失敗は、読んだページを残したまま、続きの状態(`next`)で返す。取り直すときは、TanStack Query が、読み直したページから次の cursor を求め直すので、途中の画像が消えても、同じ画像が重ねて出ない。一覧を取り直している間は続きの取得を待たせる。続きの取得が取り直しを中断すると、消した画像を含む古いページに続きが足される。
- 画面を離れる前の確かめは、TanStack Router の `useBlocker` を `useLeaveConfirmation`(`src/api/leave-confirmation.ts`)で包む。features は確かめが要るかを返す関数を渡し、確かめの状態(`Idle`・`Asking`)と、離れる・残る操作だけを受け取る。管理画面の中の移動は管理画面の Dialog で確かめ、タブを閉じる・読み込み直すときはブラウザに確かめさせる。確かめが要るかは移るときに関数を呼んで決め、state に持たないので、入力のたびに state を更新せず、effect も要らない。
- 今回の適用範囲は `src/features/`。route ごとの画面を置く `src/routes/` は今は外のライブラリを直接 import する。

## ログインとセッション

- route を、ログインの前の画面(`/login`・`/enroll`)と、ログインした後の画面(`signed-in` の下)に分ける。ログインした後の画面へ移るたびに、`admin.session.get` でセッションを確かめる。管理者が1人で数が少なく、切れたことにすぐ気づけるため。確かめる応答は待たずに画面を描き、確かめるのは query client の取得として裏で流す(「画面の遷移と読み込み」)。前の画面の取得が続いていても新しく確かめるため、セッション確認の query のキーは毎回変える。セッションが無ければ(401)、query client が状態を消し、ログインの画面に、今のパスを `redirect` に持たせて移る。移るときは、今の履歴をログインの画面で置き換える。足すと、「戻る」で、セッションの切れた画面に戻ってまたログインの画面へ送られ、前の画面にたどり着けない。ログインしていない人が URL で開くと、ログインの画面へ移るまでの間(普段は数十ミリ秒)、ナビと画面の枠が見える。データは server が 401 で断るので、見えるのは枠だけ。
- ログインした後は、まだログインの画面にいるときだけ、`redirect` のパスに戻る(応答を待つ間に履歴でほかの画面へ移っていたら、そこから動かさない)。ログインの画面にいるかは、パスを比べずに、router が今の route として選んだかで確かめる。router は大文字と小文字を区別せず、末尾の `/` も受け付けるので、パスを比べると `/LOGIN` や `/login/` で食い違った(Copilot のレビューで見つかった)。登録用 URL の画面も同じ。管理画面の中の、ログインした後の画面のパス(`/` で始まり、`//`・`/\` で始まらず、ログインと登録用 URL の画面でないもの。大文字と小文字は区別しない。router が区別せずに照らし合わせるので)だけを受け付け、ほかは捨てる(外のサイトに移させない)。
- セッションが無いという応答(401)が、ログインの前の画面(`/login`・`/enroll`)を開いているときに届いたら(前の画面から遅れて届いた 401)、状態を消すだけで、ログインの画面には移らない。登録用 URL の画面から移ると、`redirect` に URL の `#` の後ろの token まで入り、URL の search params として server に届いてしまう(Codex のレビューで見つかった)。
- ログインと登録の流れ(`src/features/auth/queries/log-in.ts`・`enroll.ts`)は、server の API と認証器を受け取る関数にし、作り物で単体テストする。server の失敗のうち、利用者に伝えるもの(期限切れ・登録されていないパスキーなど)は `_tag` の結果にし、origin の食い違いのような設定の誤りは throw する(失敗の Toast に「ログインできませんでした」と出る)。
- 認証器(`src/features/auth/webauthn/create-authenticator.ts`)は、server の options(base64url の JSON)を、そのままブラウザに渡し、ブラウザが返した資格情報の `toJSON()` の値を、contract の zod(`authenticationCredential`・`registrationCredential`)で読んで server に送る。JSON とブラウザの形のあいだの変換は、ブラウザの `PublicKeyCredential.parseRequestOptionsFromJSON()`・`parseCreationOptionsFromJSON()`・`toJSON()` に任せ、自前の base64url の変換を持たない。`toJSON()` の戻り値の型(ログインと登録の共用体で、`userHandle` は省略できる)は contract より広いので、contract の zod で、必須の項目と値の制約を実行時に確かめ、server に送る形にそろえる(`rawId` などの余分な項目は落とす)。形が合わなければ、zod の誤りを `cause` に付けて想定外の失敗として throw する。ブラウザの API を呼ぶつなぎ(`create-browser-web-authn.ts`)は、`navigator.credentials` の `get`・`create` と、JSON をパースする関数を受け取る関数にし、作り物でテストする。`main.tsx` は、`navigator.credentials` の結果を `PublicKeyCredential` に狭めて渡すつなぎと、`PublicKeyCredential` の parse の関数(`parseRequestOptionsFromJSON` など)を渡すだけにする。キャンセル(`NotAllowedError`・`AbortError`、`AbortSignal.timeout()` で止めたときの `TimeoutError`)と、登録済みの認証器(`InvalidStateError`)は、想定内の結果として返す。
- **登録用 URL の形**:`{AUTH_ORIGIN}/enroll#{token}` に決めた(server のコマンドが出す形のまま)。
- 登録用 URL の画面は、開いたらすぐに token をメモリに移し、URL と履歴から `#` の後ろを消す(`<Navigate replace to="/enroll" />`)。登録の最中に履歴を移ってから成功の `replace` が走ると、移った先の履歴を書き換えてしまうので、成功したときは、登録の画面にいるときだけホームに移る。開き直すと token は無いので、コマンドで出し直す。開いたまま新しい登録用 URL を開いたときは(`#` の後ろだけが変わるので、ブラウザは読み込み直さない)、新しい token に替え、画面に残した前の登録の知らせ(`Notice`)を消す。期限切れの URL の後に出し直した URL を同じタブに貼ると、こうなる。
- パスキーの名前は、認証器でパスキーを作る前に、contract と同じスキーマ(`passkeyName`)で確かめ、入力欄に誤りを出す。作った後で server に名前を断られると、認証器に、ログインに使えないパスキーが残る。
- セッションを確かめる API が 401 以外で失敗しても(server が落ちているなど)、何も知らせず、画面は止めない。server が落ちていれば、各画面が読むデータ(固定ページやパスキーの一覧など)の取得も失敗するので、その欄(`ErrorState`)が読み込めなかったことを知らせ、その場で取り直せる。訳した知らせとやり直すボタンの画面(`SessionErrorPage`)は、ログインした後の画面で想定外の失敗が throw されたときに出す(router の既定の画面は英語で、やり直せない)。
- ログアウトしたら、持っている状態を消して、ログインの画面に移る。
- ナビは `signed-in` の骨組みに置き、ログインした後の画面にだけ出す。セッションの確認の応答は待たずに描く。今いる画面は `useMatchRoute` で決める。`/` のリンクはホームを開いているときだけ、ほかのリンクは配下の画面を開いているときも、今いる画面として示す。ログアウトの送信状態は `AppNavigation` が1つだけ持ち、広い画面のナビと引き出したナビで共有する(drawer を開き直しても、続けて送れないように)。

## 画面の遷移と読み込み

- 画面を移るのを、通信で待たせない(ユーザーが決めた)。route の `beforeLoad`・`loader` で応答を待つと、待つ間は前の画面のまま何も出ず、固まって見える。前は移るたびにセッションの確認を待っていて、開発のサーバーで CPU が重いと、固定ページの「編集」を押してからフォームが出るまで 0.7〜0.9 秒かかり、その間ずっと前の画面だった。データは画面の中で読み、待つ間は読み込み中の表示を出す。
- 画面を移る間と、移った先の画面がまだデータの無い取得を待つ間は、画面の上端に帯(`NavigationProgress`)を流す。データのある取得の取り直しは数えない(`useIsLoadingFirstData`)。`RootLayout` に置き、ログインの前と後で同じ形にする。帯の状態は小さな部品(`RouteProgress`)が読み、状態が変わっても画面全体を描き直さない。
- 画面の中身は、移り終えた画面のパスが変わるたびに、下から浮かび上がらせる(`PageTransition`。`AppShell` が中で使う。ナビの無い骨組みも、同じ部品で包めば同じ動きになる)。URL は移り始めたときに替わるので、パスは router が選んだ最後の match から取る。パスをキーにして中身を作り直すので、同じ route でもパスが変われば state を捨てる(固定ページの A から B へ移るときなど)。search params だけが変わるときは作り直さない(種類を選んだ作成の画面が、選んだことを覚えていられる)。
- 読み込み中は、画面ごとの文ではなく、中身の形をなぞる骨組み(`LoadingState`)を、どの画面でも出す(ユーザーが決めた)。前は「固定ページを読み込んでいます。」のような文を画面ごとに出していて、読み込み中の見せ方が足りなかった。1つの取得を出し分けるだけの欄は、`QueryContent`(`src/components/`)で、読み込み中の骨組み・読み込めなかった欄・中身のどれかを出す。取得の結果で画面の見出しや操作まで替わる場合(固定ページの作成)と、取得を組み合わせる場合(固定ページの一覧・編集)は、同じ部品を画面に合わせて並べる。
- 読み込みの途中で、読み込み中の表示を作り直さない。読み込み中の欄は 150ms 経ってから浮かび上がるので、作り直すと、骨組みが一度消えてから出直す。続けて読む取得は、最後まで同じ欄を出し続ける(編集の画面。`src/features/fixed-pages/DECISIONS.md`)。

## パスキーとセッションの管理

- 画面は `/security`(セキュリティ)。パスキーの一覧と、追加・名前の変更・削除の操作と、すべてのセッションからのログアウトを置く。
- 追加と削除では、操作の前に再認証をする(`src/queries/reauthenticate.ts`)。追加では、再認証の後に新しいパスキーを作り、2つの資格情報を一緒に送る。再認証の資格情報は、server が1回で使い切るので、1つの再認証で1回だけ操作できる。名前の変更と、すべてのセッションからのログアウトには求めない(server の決まり)。
- 削除と、すべてのセッションからのログアウトは、取り消せないので、確認の Dialog を出してから送る。追加と名前の変更でも、入力のために Dialog を使う。
- パスキーの追加・名前の変更・削除が成功したら、Dialog を閉じて `success` の Toast を出す。成功を判定した Dialog が、訳した文を Toast に渡すので、パスキーの欄(`PasskeysSection`)に知らせの state や props は要らない。次の Dialog を開いても、表示中の Toast は残る。
- 失敗(再認証できない・最後のパスキー・もう無いパスキーなど)は、Dialog を開いたまま、失敗の Toast で知らせる(「知らせの出し分け」)。再認証をキャンセルしたときは知らせない。
- パスキーの3つの Dialog は、閉じても取り除かず、`isOpen` で開け閉めする。名前の変更と削除の Dialog は、最初にパスキーを選んでから描き、閉じても最後に選んだパスキーを持つ。閉じるときに Dialog を取り除くと、React Aria Components が閉じる animation を描けない。開くたびに React の `key` を変えて、送信の結果と入力を初期化する。
- server が答えたら(キャンセルのほかは)、成功でも失敗でも一覧を取り直す。再認証に使ったパスキーの最後に使った日時は、操作が断られても書き換わる。取り直す前に、送っている一覧の取得を中断する(`cancelQueries`)。最初の取得が操作より前の一覧を読んで遅れて届くと、取り直しがその取得を使い回し、追加したパスキーが一覧に出なかった(Codex のレビューで見つかった)。
- 名前の変更・削除の Dialog を閉じたとき、そのパスキーが一覧から消えていたら(削除した・ほかのブラウザで削除されていた・一覧を読み込めずに知らせに替わった)、消えた行の操作の代わりに「パスキーを追加」に focus を移す。Dialog は閉じると開いたボタンに focus を戻すが、そのボタンは行ごと消えている。パスキーの欄を `FocusScope` で包み、戻す先が消えていれば、React Aria Components がこの範囲の最初の要素(「パスキーを追加」)に focus を移すのに任せる。行が消えたかを、閉じ終えたときの DOM で React Aria Components が決めるので、一覧の取得の状態を読み直して調べずに済む。
- パスキーの追加では、新しいパスキーを作る時間を、再認証の challenge が切れる時刻の手前までに絞り、残りが30秒より少なければ、作らずに期限切れとして返す。WebAuthn の `timeout` はブラウザが変えてよい目安なので、`AbortSignal` でもその時刻に作るのを止め、止めたときは期限切れとして返す。再認証と登録の challenge はそれぞれ5分で切れるので、再認証に時間をかけると、パスキーを作れても server が再認証の期限切れで断り、認証器に使えないパスキーが残る。
- パスキーの名前は、ログインの前の登録と同じく、contract の `passkeyName` で、作る前に確かめる。
- パスキーを削除すると、server は今のセッションのほかをすべてログアウトさせるので、そのことも知らせる。

## 知らせの出し分け

操作の結果と画面の状態を、知らせの置き場所で分ける(ユーザーが決めた)。誤りは、ブラウザで確かめた入力の誤りと、server の応答で分かる誤りで出し方を変える(ユーザーが決めた)。

- 入力の誤り(送るときに validator が見つけるもの)は、入力欄に出す。送信の検証で止めたら、最初の誤りの欄を見える位置まで scroll して focus を移す(`src/components/forms/DECISIONS.md` の「送信の検証で止めたときの focus」)。どこを直すかは、欄の場所で分かるので、Toast は出さない。
- server の応答で分かる誤り(通信の失敗・再認証の失敗・もう無い対象・並べ直しでの ID の不一致・slug の重複・中身の issue など)は、失敗の Toast(`danger`)で知らせる。server が欄を名指す誤り(slug の重複など)は、Toast に加えて、その欄も誤りの状態にし、どこを直せばよいかを欄でも示す。
- Dialog の中で送った操作の失敗も、Toast で知らせ、Dialog は開いたままにする。画面の上で送った操作の失敗と、出し方をそろえる。送り直せるように、Dialog は閉じない。
- 失敗の Toast は、同じ操作を送り直すときと、その Dialog を閉じるときに閉じる(`useFailureToast`)。閉じないと、送り直して成功したとき、失敗と成功の Toast が並ぶ。Dialog の中で送った操作の失敗は、Dialog を閉じれば用が済む。引き出したナビからのログアウトに失敗したときも、広い画面と同じく Toast で知らせる。ログアウトを送り直すときも、前の失敗の Toast を閉じる(Toast の queue はログインの前と後で共通なので、閉じないと、ログインの画面に失敗の Toast が残る)。
- 再認証をキャンセルしたときは、何も知らせない。利用者が自分で OS の画面を閉じたもので、Dialog は送る前のまま開いている。Toast には `success` と `danger` しかなく、キャンセルは失敗ではない。
- 操作の成功は Toast で知らせる。固定ページの公開を切り替えたときや、並び順を保存したときに表示する。
- 画面の状態は、その場の `Notice` で知らせる。もう無いページや種類のように、直すか見直すまで続くもの。
- 読み込めなかったことは、中身の代わりに読み込めなかった欄(`ErrorState`)を出し、その中で取り直せるようにする(ユーザーが決めた)。`Notice` の1行では、次にすることも、取り直す手段も無かった。
- 押したボタンだけにかかわる結果(トークンのコピー)は、ボタンの文言とアイコンで返す(`src/features/deploy-tokens/DECISIONS.md`)。
- ログインと登録用 URL の画面の結果は、中身で分ける。押し直しても変わらない、画面の状態を表すもの(URL に token が無い・登録用 URL が使えない・その認証器はもう登録済み)は、画面の `Notice` に残す。直すには登録用 URL を出し直すか、ログインの画面へ移る必要があり、そのことを画面に残しておく。押し直せば済む、操作の一時的な結果(server がログインや登録を断った・登録されていないパスキー・時間切れ・通信の失敗)は、ほかの操作と同じく失敗の Toast で知らせ、押し直すときに閉じる。利用者が自分で閉じたキャンセルは、Dialog と同じく何も知らせない。

## `.ts` と `.tsx`

`.tsx` は、JSX の要素か fragment を書くファイルだけにする(ユーザーが決めた。`project/require-jsx-in-tsx` で止まる)。JSX を書かない hook・context・router の組み立て・テスト・story は `.ts` に置く。

- 拡張子で、マークアップを持つファイルかどうかが分かる。JSX の無い `.tsx` は、hook や組み立ての関数を、部品のファイルのように見せる。
- `.tsx` では、generic な arrow function の型引数を JSX と読み分けるために、`<Value,>` のように `,` を足す必要がある。
- ロジックを React なしでテストできるように、React の値を import できる `.ts` を次の2つに限る(ユーザーが決めた。`project/no-react-in-logic` で止まる)。型だけの `import type` は、どの `.ts` でもよい。
  - hook のファイル:名前が `use-` で始まり、export する関数が、名前が `use` で始まる1つだけ。
  - context のファイル:名前が `-context.ts` で終わり、`createContext` の結果(1つ以上)と型だけを export する。context を読む hook は、hook のファイルに分ける(`hooks/use-show-toast.ts`)。
- 前は `.ts` から React を一切 import させなかった。そのため、hook と context が `.tsx` に置かれ、JSX の無い `.tsx` を生んでいた。
- `src/` の hook のファイルにも、関数を export する `.ts` と同じく、隣のテストを求める(`project/require-sibling-test`)。`.storybook/` の `useHtmlPreferences` は、全部の story を描くテスト(`src/__tests__/stories.test.tsx`)で確かめる(`tooling/DECISIONS.md` の `require-sibling-test`)。hook が呼び出し側に約束する振る舞い(`useShowToast` は Provider の外で呼ぶと throw する、`useLogOut` はログアウトを送ってログインの画面へ移る、など)を、`renderHook` で確かめる。テストのファイルの拡張子も JSX の有無で決まるので、`.test.ts` と `.test.tsx` のどちらでも数える。

## テスト

マークアップの作りをなぞるだけのテストは書かない。実装をなぞるテストは、実装を変えるたびに直すだけで、何も守らない。

- ロジックはできる限りマークアップから分けて `.ts` に置き、テストを必ず書く。hook にもテストを書く(「`.ts` と `.tsx`」)。
- ロジックに切り出しにくい出し分けは、コンポーネントのテストで確かめる。要素は role・label・text など利用者に見えるもので探し、利用者に見える結果を確かめる。test id、DOM のたどり方、クラス名、スナップショットのように、マークアップの作りに依存する探し方と確かめ方は使わない。
- 出し分けの無いコンポーネントには、テストを求めない。
- 決まった文言を描画して確かめるだけのテストは lint を通ってしまうので、セルフレビューで見る。
- 管理画面の `src/` のテストは、リポジトリの直下の `bun test` から外し(直下の `bunfig.toml`)、`apps/admin` で別に流す(`apps/admin/bunfig.toml` の `root` を `src` にする)。DOM(happy-dom)を用意する preload を、画面のコードのテストにだけ掛けるため。happy-dom は `fetch`・`Request`・`Response`・`setTimeout` などのグローバルを置き換えるので、直下で掛けると server のテストまで happy-dom の上で流れる。`bunfig.toml` は、`bun test` を流すフォルダのものだけが読まれる(手元で確かめた)。
- Vite の設定とビルドのテスト(`apps/admin/__tests__/`)は、直下の `bun test` で、DOM なしで流す。Vite は Node の `setTimeout` を前提にしていて(`unref()` を呼ぶ)、happy-dom の上では開発のサーバーが起動しない。
- 画面のテストは、`src/testing/render-app.tsx` で、作り物の server と作り物の認証器につないだ管理画面の全体(router・query client・言語)を描く。パスキーの画面のテストには、パスキーとセッションの procedure を状態ごと真似る作り物(`fake-routes/create-passkey-routes.ts`。1つの再認証で1回だけ操作できる・無いパスキーは `NOT_FOUND`・最後のパスキーは `LAST_PASSKEY`・ログアウト(今のセッションからでも、すべてのセッションからでも)した後は `UNAUTHORIZED`)と、決めた答えを返す作り物の認証器(`create-fake-authenticator.ts`)を使う。client は本物を使う。画面・router・client のつなぎを、利用者に見える結果と、呼ばれた procedure の並びで確かめられる。作り物の server は、ログイン(`create-sign-in-routes.ts`)と登録用 URL(`create-enrollment-routes.ts`)のものも `src/testing/fake-routes/` に置き、テストと画面の story で使い回す。router と query client の組み立ては `create-test-app.ts` にまとめ、テストの `render-app.tsx` と story の `app-preview.tsx` が使う。`src/testing/` は、テストと story だけが import できる(`tooling/structure/` のテストが止める)。
- 作り物の server は、`implement(contract)` で procedure ごとに handler を作り、応答を決めた procedure だけを `RPCHandler` に渡す。入力・出力・定義した失敗の code を contract から推論でき、contract 全体の handler を用意せずにテストできる。テストと story では、パスをキーにした応答を spread で組み合わせられる。成功は `{ output }`、contract に定義した失敗は `{ error }` を書けばよく、HTTP のステータスは contract の失敗の定義(`errorMap`)から決まる。失敗に値を添えるときは `data` を書く(`INVALID_CONTENT` の `issues` など)。`data` の形は、型では確かめず(`unknown`)、実行時に oRPC が contract で確かめる。形が合わなければ、定義していない失敗として client に届くので、テストで気づける。oRPC の失敗を作る関数(`errors`)は、`data` が必須の失敗では引数の型が合わないので使わない。`{ error: "INTERNAL_SERVER_ERROR", defined: false }` で定義していない失敗を返す。応答を決めていない procedure は、本物の server と同じくテキストの 404(`text/plain`)を返し、そのパスも `calls` に残す。
- 固定ページの画面のテストと story には、固定ページと種類の procedure を状態ごと真似る作り物(`fake-routes/create-fixed-page-routes.ts`)を使う。server の決まりのうち、slug の重複は `SLUG_TAKEN`、無い種類は `UNKNOWN_KIND`、定義に合わない中身は `INVALID_CONTENT`(contract の `toContentSchema` で確かめる)、ID の食い違い(大文字と小文字だけ違う ID の重なりも)は `ORDER_MISMATCH`、無いページは `NOT_FOUND`、新しいページは非公開で最後に付く、更新は中身を丸ごと置き換え、slug・タイトル・中身が変わったときだけ `updatedAt` を進める、公開し直しても公開した日時を変えない、を真似る。同時のリクエストのような、テストで起こさない状況は作り込まない。セッションは確かめず、ログインした後の画面を開ける答えを返す。`replyNext` で次の1回の応答を決め、ほかで消えたページや増えたページは、`routes` の handler を直に呼んで作る。
- パスキーの状態を真似る作り物の server では、入力の検証より先にセッションを確かめる。ログアウト後に不正な入力を送っても、本物の server と同じく `UNAUTHORIZED` を返す。テストが次の1回の応答を決めているときは、セッションや入力にかかわらず指定した応答を返し、出力は contract で検証する。次の応答の指定は入力の検証前に一度だけ取り出す。通常の handler ではセッションを再確認し、入力を検証している間にログアウトした場合は処理を行わない。別の関数で包むときは、`wrapFakeRoute` で指定した応答とセッションの確認を引き継ぎ、入力の検証より先に適用する。ログインと登録の作り物は、成功の出力が contract を満たす場合だけセッションを成立させる。
- tsconfig を2つに分ける。`tsconfig.app.json` は、テストを除いた `src/` を、Bun の型なしで検査する(画面のコードが Bun の API の型を読めないように)。`tsconfig.json` は、テスト・`vite.config.ts`・`test-setup/` を含めて Bun の型で検査し、型付きの lint もこちらを使う。

## Storybook

部品と画面を、light と dark、言語ごとに見比べるために使う(ユーザーが決めた)。Storybook 10.6(`storybook`・`@storybook/react-vite`・`@storybook/addon-a11y`)で、`bun run storybook` で `http://localhost:6006` に起動する。

- story は CSF 3 で書く。Storybook の文書が勧める形で、CSF Next(factories)は preview の扱いで API が変わりうる。
- story は、部品の隣の `__stories__` に `<名前>.stories.ts`(JSX を書くなら `.stories.tsx`)で置く。title は `primitives/Button` のように書き、フォルダの名前(`__stories__`)を入れない。story の中の文は、見本の文なので訳を通さずに書く。
- Storybook の Vite は `vite.config.ts` を読むが、`build` は `target` しか引き継がず、`server` は上書きする(10.6.8 の配布物で確かめた)。`viteFinal` で `build.target` と `build.cssTarget` を `vite.config.ts` と同じ `BROWSER_TARGET` に入れ直す。入れないと、`storybook build` で `light-dark()` が書き換えられ、`scheme-dark` が効かなくなる(`src/ui/DECISIONS.md` の「light と dark」)。開発のサーバーの port・`strictPort`・`/api` の proxy は Storybook が上書きするので、ぶつからない。
- head に script を書き込む plugin は、Storybook では外す(`withoutVitePlugins`)。言語と配色はツールバーで選ぶ(既定は light と日本語)。story を包む枠(`.storybook/story-frame.tsx`)は、ツールバーの言語で i18next の instance を作り、React Aria Components の `I18nProvider` もその言語を読む。言語が変わったら `useMemo` で新しい instance を作り、Provider の値を差し替えるので、story の state は残る。`useHtmlPreferences` は、ブラウザが描く前に html の `lang` に story に見える文の言語を、`data-theme` に配色を入れる。
- 部品の story の見本の文は日本語なので、html の `lang` を `ja` にする(`parameters.contentLang`)。ツールバーの言語を `lang` にすると、zh-Hans で、かなが中国語の字体で描かれた(ユーザーが見つけた)。画面の story は訳を出すので、`contentLang: null` にして、ツールバーの言語を `lang` にする(`contentLang` を書かないと、既定の `ja` を引き継ぐ)。文字の見本は、見本の文ごとに `lang` を付ける。言語を付けないと、日本語の字体に無い簡体字だけが別の字体に替わり、1つの文の中で字体が混ざった。
- 部品の story は、既定で、Storybook の真ん中に置いた展示用の枠(`src/ui/specimens/story-stage.tsx`。面の色と、地の上に重ねる半透明の線)の中に描く(`parameters.stage`)。小さい部品は枠を中身の大きさにし、幅で見え方が変わる部品(`Notice`・入力欄・`Form`・`Text`・`Stack` など)は決めた幅(`w-lg`)にする。画面全体の story(画面・`AppShell`・`Center`)と色・文字の見本は、枠を付けない。枠も寄せも無いと、小さい部品が左上の隅に集まって見えにくかった(ユーザーの指摘)。
- 枠は TanStack Router の route を描かず、`Link` が読む router だけを `RouterContextProvider` で渡す(router は枠ごとに作り、story のあいだで履歴を持ち越さない)。route を描くと、route の境界が story の想定外の失敗を受け止め、Storybook にもテストにも上がらない。
- a11y は `@storybook/addon-a11y` の panel で見る(コントラストを含む)。Vitest を入れていないので、a11y の誤りで落とすテストにはしない。
- 全部の story を `composeStories` で happy-dom の上に描き、想定外の失敗も `console.error` も出さないことを、テスト(`src/__tests__/stories.test.tsx`)で確かめる。ツールバーの値が html の `lang`・`data-theme` と部品の訳に届くことと、`viteFinal` が `cssTarget` を入れて head の script の plugin を外すことも、テストで確かめる。CI では Storybook を起動もビルドもしないので、壊れた story に気づけるのはこのテストだけ。手間は、story のファイルを足すたびに import を1行足すことで、足し忘れると、一覧と `__stories__` のファイルを比べるテストで落ちる。happy-dom は配置を計算しないので、見た目(並び・中心・余白)は Storybook をブラウザで開いて測る(セルフレビューの観点)。
- 画面の story(`src/routes/` の下の `__stories__`)は、`src/testing/app-preview.tsx` で、作り物の server と作り物の認証器につないだ管理画面の全体を描く。テストと同じ作り物なので、ボタンを押せば、作り物の server の答えで画面が進む。server の状態は、story を開いたときに作る(`createRoutes`。Controls で変えても作り直さないので、`path` などは Controls から外す)。ログインと登録の story は、成功した後にパスキーの画面まで進めるよう、パスキーの作り物の server もつなぐ。ボタンを押してから出る状態(登録していないパスキーでのログイン・使えない登録用 URL など)は、story ごとに作り物の server と認証器の答えを決めておき、story を開いて押すと見られるようにする。play で押させると、Storybook が操作を React の `act` の中で流し、router の suspend とぶつかって、入力した名前が消えた画面に描き直された。そのため play は使わない。押した後の状態は、画面のテストが確かめている。
- 画面の story は訳を出すので、html の `lang` をツールバーの言語にする(`contentLang: null`)。
- telemetry は切る(`core.disableTelemetry`)。

## server の認証に合わせること

server の判断は `apps/server/src/features/auth/DECISIONS.md` にある。

- **送信中はボタンを無効にする**:パスキーの削除などを続けて送ると、先のリクエストで成功しても、後のリクエストが失敗を返すことがある(使い切った再認証の資格情報、消えたセッションなど)。server ではそろえないので、画面の表示と結果が食い違わないよう、送らせない。
- **ログインの最中に、ほかの管理用 API を呼ばない**:期限を延ばした応答と、ログインし直した応答が逆の順で届くと、新しい Cookie が古い token で上書きされうる。server では防がないので、ログインの最中に、期限を延ばしうるリクエストを送らない。管理画面では、gate(`src/features/auth/create-auth-gate.ts`)が守る。ログインと登録用 URL からの登録は、送っている管理用 API が終わるのを待ってから始め、その最中の管理用 API(`/api/admin/` へのリクエスト)は、終わるまで待ってから送る。ログインの画面で履歴を進めて、ログインした後の画面のセッションの確認が走っても、ログインを追い越さない(Codex のレビューで見つかった)。
- **登録用 URL の画面**:最初の登録と復旧は、server のコマンドが出す登録用 URL で行う。token を `#` の後ろに置くのは、server のアクセスログや Referer に残さないため。画面は、token を読んで options を取り、パスキーを作らせて登録する。

## 割り切ったこと

- **画面の story の作り物の server の状態**:ログインと登録の story は、ログインの作り物とパスキーの作り物をつないだだけなので、ログインの状態とパスキーの一覧の状態が別々に動く(すべてのセッションからログアウトした後の再ログインや、登録した名前の一覧への反映が合わない)。story は画面を見るためのもので、流れのつながりは画面のテストが確かめる(Codex のレビューで見つかった)。
- **secure context でない origin**:`main.tsx` は起動のときに `PublicKeyCredential` を読むので、`localhost` 以外の HTTP で開くと、描く前に止まる。管理画面は HTTPS と `localhost` でだけ使う(Codex のレビューで見つかった)。
- **全部の story を描くテストが確かめないこと**:このテストは、story が誤り(throw と `console.error`)を出さずに描けることだけを確かめる。story が何も描かなくても、展示用の枠を数えて通り、一覧を読めない story は、知らせが出る前の、読み込み中の画面で通る。それぞれの状態は画面のテストが確かめ、部品の見た目は Storybook で見る。
- **Storybook の狭い画面**:幅を決めた展示用の枠は、Storybook の画面が 544px より狭いと、横にはみ出す。Storybook はデスクトップのブラウザで見るので、受け入れる。
- **開発のときの head の script**:開発のサーバーは、HTML を返すたびに、head の script を Vite の lib のビルドでまとめ直す(数十ミリ秒)。まとめた結果を使い回すと、`src/preferences/boot.ts` と、それが読むファイルを直したときに開発のサーバーを起動し直す必要がある。待ち時間が気になったら、依存が変わったときだけまとめ直す形にする。
- **`localStorage` が使えない設定**:head の script は、`localStorage` を読めないと(ストレージを切った設定など)throw し、言語と配色を当てずに終わる。React は html の `lang` が無ければ英語にするので、画面は英語で出る。言語を切り替えたときも、`languageChanged` の event の中で `localStorage` に置けずに throw し、後に登録した listener(画面の描き直し)まで event が届かない。管理者が自分のブラウザで使うだけなので、受け入れる。
- **言語の切り替えのつなぎ**:`main.tsx` が `syncLocale` を呼ぶことは、テストで確かめていない(Codex のレビューで挙がった)。`main.tsx` は、ほかのつなぎ(認証の gate・認証器など)と同じく、入口として確かめない。`syncLocale` と、切り替えで画面の訳と React Aria Components が出す文言が変わることは、それぞれのテストで確かめている。
- **画面の外へ移る focus**:パスキーを削除して行が消えると、React Aria Components は「パスキーを追加」に focus を移すが、scroll はしない。パスキーが多く(幅 390px の画面で8個ほど、desktop で12個ほど)、一覧を下まで scroll して下の行を削除すると、focus は画面の外へ移る(Chrome と WebKit で確かめた)。次の Tab でブラウザが scroll して戻り、スクリーンリーダーは focus の先を読む。scroll させるには React Aria Components の内部の event に頼る必要があり、起きるのはパスキーが多いときだけなので受け入れる(ユーザーが決めた)。
- **ほかのタブの管理用 API**:ログインの最中に管理用 API を送らせない gate は、タブごとにある。ほかのタブが同じ時に管理用 API を送ると、その応答の `Set-Cookie`(期限を延ばした古い token、または切れたセッションを消す指示)が、ログインした応答の後に届き、新しい Cookie を上書きしうる。起きても、次の操作が 401 になってログインし直すだけで、管理者は1人で、ログインの最中にほかのタブを操作することは少ない。タブをまたいで止めるには、Web Locks API などで管理用 API を全部くるむ必要があり、手間に見合わないので受け入れる。
- **ログアウトを送っている間のほかの操作**:ナビのログアウトを送ってから応答が届くまでの間も、セキュリティ画面のパスキーの追加と、すべてのセッションからのログアウトを始められる。ログアウトの応答が、パスキーの追加で、再認証とパスキーの作成の OS の画面を済ませるまで遅れると、登録が 401 になり、認証器にログインに使えないパスキーが残る。すべてのセッションからのログアウトを確定するまで遅れると、それが 401 になり、ほかのセッションが残ったまま、知らせずにログインの画面に移る。ログアウトの応答は普段は数十ミリ秒で届き、その間にこれらの操作を進めることは、通信がひどく遅いときにしか起きないので受け入れる(ユーザーが決めた)。
- **画面を移ったときの focus**:引き出したナビのリンクで画面を移ると、閉じ終えた後の focus は開くボタンに戻る。広い画面のナビで移ると、focus はリンクに残る。どちらも、スクリーンリーダーには画面が移ったことが読まれない(見た目には影響しない)。画面を移るたびに見出しへ focus を移すか、画面の名前を読ませるかは、管理画面の全体の扱いとして別に決める(ユーザーが決めた)。
- **ナビを描き直した後のログアウトの失敗の Toast**:ログアウトを送り直すときに前の失敗の Toast を閉じる関数は、ナビ(`useLogOut`)が持つ。失敗の Toast を閉じずに画面を移り、その画面で想定外の失敗が throw されてナビが取り除かれると(`SessionErrorPage` に替わる)、閉じる関数を失う。やり直してナビが戻り、ログアウトを送り直して成功すると、ログインの画面に前の失敗の Toast が残る。ログアウトが失敗した後に、移った画面で想定外の失敗が起きたときだけ起き、残るのは閉じるボタンで消せる Toast 1つ。閉じる関数を Toast の queue と同じ寿命で持つ仕組みは、手間に見合わないので受け入れる。 ログアウトの応答を待つ間にほかの画面でセッション切れが分かり、ログインの画面へ移った後にログアウトが 500 を返したときも、失敗の Toast が出る。これを防ぐには応答を受けた時点のセッションも確かめる必要があり、どちらも表示された Toast を閉じれば済む。
- **画面を離れた Dialog の失敗の Toast**:Dialog の中の送信が失敗して失敗の Toast が出たまま、Dialog を閉じずに履歴で画面を離れると、Toast を閉じる関数(`useFailureToast`)が Dialog と一緒に無くなる。戻って同じ操作を送り直し、成功すると、前の失敗と成功の Toast が並ぶ。Dialog を開いたまま履歴で移り、戻って送り直したときだけ起き、残るのは閉じるボタンで消せる Toast 1つ。上のログアウトと同じく、閉じる関数を Toast の queue と同じ寿命で持つか、部品が取り除かれるときに閉じる effect が要るので受け入れる。
- **引き出したナビの上のログアウトの失敗の Toast**:狭い画面で、引き出したナビからログアウトに失敗すると、Toast はナビを開いたまま画面の上の中央に出て、ナビの最初のリンクに重なる。重なりは Toast を閉じるか、ログアウトを送り直すまで続く。Toast は閉じるボタンで消せ、ナビの閉じるボタンは覆わない。ナビを開いているときだけ Toast の位置を変えるには、Toast の位置の決まり(`src/ui/DECISIONS.md` の「Toast の位置」)をナビと一緒に組み直す必要があり、ログアウトの失敗のときだけなので受け入れる。
- **Zod の設定を当てる順**:`main.tsx` の最初の import で Zod の設定を当てることは、テストで確かめていない。順が崩れると、CSP の違反が console に1件戻るだけで、検査の結果は変わらない。確かめるには、CSP を掛けたブラウザでビルドを開くテストが要り、手間に見合わない。
- **言語を切り替えたときに出ている知らせ**:入力欄の誤りの知らせか、失敗の Toast を出したまま、ナビで言語を切り替えると、その文は前の言語のまま残る(固定ページの編集で、タイトルを空にして保存し、English に替えて確かめた)。フォームの部品と、固定ページ・パスキー・デプロイ用のトークンの検証は、確かめたときに訳した文字列を持ち、React Aria Components もその文字列を持ち続ける。Toast も、出したときに訳した文字列を queue に持つ。誤りの知らせは、次に確かめたとき(送り直す・入力を直す)か、Dialog や画面を開き直したときに、今の言語になる。Toast は閉じれば消える。出るのは、知らせを出したまま言語を替えたときだけで、中身は正しい。直すには、誤りと Toast を訳のキーと引数で持ち、描くときに訳す形に、フォームの部品・Toast・各 feature をそろえて替える必要があり、手間に見合わないので受け入れる。
