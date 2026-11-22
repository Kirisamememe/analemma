# 決めたことと理由(デザインシステム)

管理画面と公開サイト(Amayadori)で、同じデザインシステムを使う(ユーザーが決めた)。全部の変数の原本は `theme.css`。アプリごとに変えるのは1層目のパレットだけで、2層目から下(役割の名前・文字の目盛り・状態・規則)はそろえる。公開サイトへの配り方は、まだ決めていない(リポジトリの `AGENTS.md` の「まだ決めていないこと」)。

## 考え方

- CSS の変数は土台でしかない。色の組み合わせ・文字の役割・状態の見せ方といった具体的な UI の規則は、部品の層で守る(ユーザーが決めた)。変数を増やして規則を表そうとすると、変数が増えるほど選び方の自由も増え、守らせたいことが守られない。層を増やして、変数の層は柔軟に、部品の層は厳しくする。
- 管理画面では、画面のコードに色も不透明度も選ばせない。画面のコードは `<Badge tone="danger">` のように用途を部品に渡し、どの色をどの不透明度で使うかは、部品の中で用途ごとに1つに決める。公開サイトは決まりから外れる UI が多いので、もっと柔軟にする(公開サイトを作るときに決める)。
- 変数は、エージェントが覚えて選べる数に抑える。

## 層

| 層                    | 置く所                                | 中身                                                                                                 |
| --------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1. パレット           | `theme.css` の `:root`(`@theme` の外) | `--palette-<系統>-<段>`。class にならない。アプリごとに差し替える                                    |
| 2. 役割               | `@theme static`                       | 色・文字・角丸・影・重ね順・幅・画面の幅・格子・縦横比・動き                                         |
| 3. utility と variant | `@utility`・`@custom-variant`         | 大きさ(`h-control` など)・状態(`state-hover` など)・`focus-ring`・状態の variant                     |
| 4. base               | `@layer base`                         | light と dark の切り替え、言語ごとの字体、`th`・`::selection`・`mark`、reduced motion、forced-colors |

- `@theme static` の先頭で `--*: initial` にして、Tailwind の既定の変数を全部消し、要るものだけを書き戻す。既定が残ると、`font-serif`・`tracking-*`・`drop-shadow-*` のような、デザインシステムに無い class が作られる。
- `static` にして、使っていない変数も出力する。役割の色はパレットの変数を `light-dark()` で参照するので、部品の中の `var()` からも読める必要がある。

## 色

不透明な色を17個だけ持つ。

| 種類                       | 名前                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| 面                         | `canvas`(画面の地)・`surface`(カード・ダイアログ・入力欄)・`surface-sunken`(サイドバー・表の見出し) |
| 文字と線                   | `fg`・`fg-muted`(補足と placeholder)・`line`(線の既定)・`focus`                                     |
| 塗り                       | `primary`・`on-primary`・`danger-strong`・`on-danger-strong`(削除のボタン)                          |
| 意味                       | `info`・`success`・`warning`・`danger`                                                              |
| light と dark で変わらない | `scrim`(写真や画面の上に重ねて暗くする色)・`on-media`(写真の上の文字)                               |

- 透明度付きの色の変数は作らない。薄い色は、部品の中で Tailwind の不透明度の修飾(`bg-danger/10` など)で作る。透明度付きの変数を足していくと、同じような色の変数が増える。
- 面の色は不透明にする。`surface-sunken` は sticky の見出しにも使うので、下が透けない。
- 意味の色の塗りの上の文字は `text-canvas` にする(light では白、dark では黒になる)。dark の意味の色は明るいので、白い文字では読めない。
- 削除のような取り消せない操作のボタン(`Button` の `danger`)は、`danger` と別の塗り `danger-strong`(light は red-700、dark は red-600)に、白い文字 `on-danger-strong` を載せる。dark では、暗い面の上の赤い文字が 4.5:1 に届くには明るい赤(red-400)が要り、塗りの上の白い文字が 4.5:1 に届くには濃い赤が要るので、1つの赤では両立できない。red-400 の塗りに黒い文字では、色が薄く見えた(ユーザーが決めた)。`danger` は、文字・枠・薄い面(`Notice`・`Badge`・入力欄の誤り)の色として残す。名前は `primary` と `on-primary` に合わせ、`on-X` が `X` の上に載る文字の色。
- `black`・`white` という名前は使わず、用途の名前(`scrim`・`on-media`)にする。`bg-white` をカードに、`text-white` を塗りの上に、と書かれやすく、dark の意味の色の塗りの上の白い文字は、コントラストが 1.7〜2.9:1 しかない。
- パレットの値は、shadcn/ui の neutral に合わせる。管理画面の `primary` は白と黒。役割の名前は、自分たちの名前(`canvas`・`surface`・`fg` など)を使う。
- light の意味の色は、薄い面の上の文字でも 4.5:1(WCAG の AA)に届く段にする(red-700・green-800・amber-800・blue-700)。
- コントラストは、theme.css を読むテスト(`apps/admin/__tests__/theme-contrast.test.ts`)で確かめる。塗りと、その上の文字の組(`on-*`)は、hover の重ねも含めて 4.5:1 に届く。意味の色は、面(`canvas`・`surface`・`surface-sunken`)と、その上の `/10` の薄い面の上の文字として、light でも dark でも 4.5:1 に届く。OKLCH を sRGB に直し、sRGB に入らない色は 0〜1 に切って計算する。pressed の重ねは確かめない(「割り切ったこと」)。
- dark の `surface-sunken` は、`surface` と別の段(neutral-950)にする。同じ色だと、dark のサイドバーで、今いる場所が見分けられない。
- light の `focus` は neutral-500 にする。白に対して 3:1 に届く。
- 未選択の Checkbox・Switch の off のような部品の枠は、`fg-muted` で描く。部品の枠には 3:1 が要り、`line` では届かない。色は足さない。

## light と dark

- 役割の色は、`light-dark()` で、light と dark にパレットのどの段を使うかを1つの定義に持つ。`dark:` の variant は使わない。1つの定義なら、light だけ直して dark を直し忘れることがない。
- 利用者が配色を選んだら、html の `data-theme` で `color-scheme` を固定する。選んでいなければ OS に従う。
- 部分だけを dark(light)にするときは `scheme-dark`(`scheme-light`)を使う。`color-scheme` を変えるだけでは、`:root` から継いだ文字の色が評価し直されないので、文字の色も入れ直す。
- Vite の `build.cssTarget` を `chrome123`・`safari17.5`・`firefox128` にする。既定のターゲットでは、圧縮のときに Lightning CSS が `light-dark()` を `--lightningcss-light`・`--lightningcss-dark` の変数に書き換え、`scheme-dark` で部分だけを dark にすると効かなくなる。下限は `light-dark()` を読めるブラウザで、Firefox だけは Tailwind CSS v4 の公式の下限(128)に合わせる。本番のビルドの出力に `--lightningcss-` が無いことを、テスト(`apps/admin/__tests__/vite-config.test.ts`)で確かめる。

## 文字

- 文字の大きさ(`--text-*`)と行間(`--leading-*`)を、同じ名前・同じ値の目盛りにする(`xs` 12・`sm` 14・`base` 16・`lg` 18・`xl` 20・`2xl` 24・`3xl` 28・`4xl` 32・`5xl` 36)。必ず `text-sm/xl`(14px の文字に 20px の行間)のように組で書く。大きさと行間を別々の目盛りにすると、組み合わせを毎回選ぶことになる。
- 本文・見出し・補足といった文字の役割は、CSS の変数にしない。`Text`・`Heading` の部品が、役割ごとに目盛りの組と太さを選んで守る。
- 太さは 400・600・700(`font-normal`・`font-semibold`・`font-bold`)だけ(ユーザーが決めた)。
- 和文を主役に組む。`:lang()` で言語ごとに字体を切り替え、本文を出す要素には本文の言語の `lang` を付ける。`lang` の付いた要素では、字体を一度既定に戻してから言語ごとに上書きする。規則の無い言語(`ko` や繁体字など)が、親の和文の字体を継がないようにするため。
- 禁則(`line-break: strict`)・和文と欧文の間の空き(`text-autospace`)・日本語の文節での改行(`word-break: auto-phrase`)は CSS に任せる。等幅の要素(`code`・`kbd`・`samp`・`pre`)では、空きを入れると桁がずれるので切る。

## 状態

- hover と pressed は、その要素の文字の色(`currentColor`)を薄く重ねる utility(`state-hover`・`state-pressed`)で表す。塗りのボタンでも、透明な行でも、どの面の上でも同じに働く。`background-image` を使うので、`bg-linear-*` と一緒には使えない。
- 状態の variant(`is-hovered`・`is-selected`・`is-disabled` など)は、部品のライブラリが付ける属性に名前を付けたもの。`theme.css` に、勝たせたい順に並べ、無効を最後に置く。生の `data-*:` の variant は名前の順に並ぶので、`data-disabled:` が一番弱くなる。値を持つ属性(並べ替えの向き・placement・orientation など)は variant にせず、部品の render props から渡す。公開サイトでは、そちらの部品のライブラリの属性に合わせて、同じ名前で定義し直す。
- `is-current` は `aria-current` も見るので、`:where()` で包んで、ほかの variant と詳細度をそろえる。包まないと `is-disabled` に勝つ。
- reduced motion では、base で transition だけを一律に止める。animation は、止めたときの見せ方(spinner をどう見せるかなど)が部品ごとに違うので、部品の中で `motion-reduce:` で決める。base で animation まで `!important` で止めると、部品で見せ方を作れない。
- forced-colors では、役割の変数をシステムの色(`Highlight` など)に差し替える。塗りの `danger-strong` と `on-danger-strong` は、`primary` と `on-primary` と同じく `Highlight` と `HighlightText` にする。

## 部品の層

| 置く所                | 中身                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `tv.ts`               | theme.css の名前を merge の設定に入れた `tv` と `merge`                                               |
| `typography.ts`       | 文字の役割と、目盛りの組と太さの対応(組を書けるのはここだけ)                                          |
| `primitives/`         | ボタン・リンク・入力欄・`Notice` など、いちばん小さな部品。React Aria Components を使えるのはここだけ |
| `layout/`             | 並べ方(`Stack`・`Cluster`・`Center`・`AppShell`)と文字(`Text`・`Heading`)                             |
| `patterns/`           | primitives と layout を組み合わせた、画面に共通の形(`PageHeader` など)                                |
| `features/<名前>/ui/` | 1つの画面だけの部品(`ui/` と同じ決まり)                                                               |

- import の向きは、patterns → primitives・layout。layout は primitives と patterns を、primitives は patterns を import しない(lint で止まる)。layout は並べ方と文字だけを持つ層で、操作を持たない。
- React Aria Components(`react-aria`・`react-stately`・`@react-aria/*`・`@react-stately/*`・`@internationalized/*` と、型だけの import も)を import できるのは `primitives/` だけ。primitives は、React Aria Components の props の型を extends せず、自分の props の型を持つ。画面のコードに、ライブラリの props(`className` の関数や、`data-*` の render props など)を見せない。ライブラリを替えるときに直すのは primitives だけになる。
- `tailwind-variants` は `tv.ts` だけが import し、ほかは `tv.ts` の `tv` と `merge` を使う(lint で止まる)。既定の入口の `tv` は theme.css の名前を知らず、`z-sticky z-overlay` のような theme.css の名前の組を merge できずに両方残す(後から渡した class で上書きできない)。
- merge の設定には、theme.css の名前(色・文字の目盛り・角丸・影・重ね順・幅・動き)と `@utility` の名前を入れる。theme.css の名前ごとに「同じ組の2つを渡すと後だけが残る」ことと、`@utility` ごとに組の相手を決めてあることを、theme.css を読むテスト(`apps/admin/__tests__/tailwind-merge.test.ts`)で確かめる。名前が1つしかない組(`grid-cols-thumbnails`・`aspect-photo`)は、Tailwind CSS の既定の class を相手にする。`tv` の variant を通しても merge が効くことも確かめる。名前の一覧と見比べるテストにすると、設定を写しただけになり、merge が本当に効くかを確かめない。`state-disabled` は透明度と押せるかどうかを変えるだけで、hover や pressed とは組にしない(組にすると、`state-hover state-disabled` で hover の見た目が消える)。
- 文字の役割と組:`body`(`text-sm/xl`・400)・`body-long`(`text-sm/2xl`・400。長い文)・`caption`(`text-xs/lg`・400)・`label`(`text-sm/xl`・600)・`section`(`text-base/2xl`・600)・`page`(`text-xl/3xl`・700)・`display`(`text-3xl/5xl`・700)。`Text` と `Heading` は、文字の役割を `variant` で受ける(`role` にすると、ARIA の `role` と取り違える)。`Heading` は見出しのレベル(h1〜h3)から役割の既定を決め(レベル 1 は `page`、2 と 3 は `section`)、見た目とレベルを別々に選べる。
- `UiProvider`(`primitives/ui-provider.tsx`)が、React Aria Components に、html の `lang` から決めた言語(`I18nProvider`)と、TanStack Router の navigate(`RouterProvider`)を渡す。リンクは TanStack Router の型の付いた行き先だけを受け、画面を読み込み直さずに移る。

### 部品の決まり

- **塗りのボタン**:`border border-transparent` を付ける。forced-colors で、塗りが消えても線として残る。
- **押せない・送信中**:見た目(`state-disabled` など)だけでなく、React Aria Components の props(`isDisabled`・`isPending`)で動きを止める。CSS の `pointer-events` はキーボードの操作を止めない。送信中のボタンは、focus を残したまま押せなくし、spinner を、訳した名前の付いた `ProgressBar` の中に出して、待っていることをスクリーンリーダーに伝える(spinner だけでは、スクリーンリーダーはボタンの名前しか読まない)。spinner は `block` にし、`ProgressBar` の箱を spinner の大きさにして、ボタンの `items-center` で文字の中心にそろえる(`inline-block` では、行の高さの箱の中で baseline に載り、文字より 2〜3px 上にずれる)。React Aria Components は送信中のボタンを `type="button"` に変えるので、入力欄の Enter がフォームを送り直せる。`Form` にも `isPending` を渡し、送信中は送らない(管理画面の「送信中はボタンを無効にする」)。
- **長い語の折り返し**:`Text`・`Heading`・Dialog の見出しは `wrap-anywhere`(`overflow-wrap: anywhere`)にする。パスキーの名前のような利用者が付けた文字列は、空白の無い長い英数字でもよいので、語の途中でも折り返し、狭い画面や拡大で横にはみ出さないようにする(flex の中でも、min-content の幅が縮む)。happy-dom は配置を計算しないので、テストでは確かめない(Copilot のレビューで見つかった)。
- **リンク**:いつも下線を付ける。`primary` が中立色なので、色だけではリンクと分からない。
- **入力欄**:ラベル・補足・誤りの知らせを、React Aria Components の slot で入力欄に結びつけ、補足と誤りを入力欄の説明として読み上げさせる。server が断った入力は、`Form` の `validationErrors` で入力欄ごとに出す。
- **`Notice`**:誤り(`danger`)は `alert` にしてすぐに読み上げ、ほかは割り込まない `status` にする。`Notice` は、その場に残す知らせ(送信の誤りや、読み込めなかったことなど)に使い、保存したなどの操作の結果は Toast で知らせる(Toast を足すときに作る)。
- **見出しの操作と補足**:`PageHeader` は、`false`・`null` の操作と、空の補足を、無いものとして扱う(条件で出さない操作のために、空の要素が余白を取らないように)。
- **overlay**(`Dialog`):border と `shadow-overlay` を付け、地を `bg-scrim/40` の backdrop で覆う。dark では scrim がほとんど効かないので、border で地と分ける。送信中は、Escape と backdrop の押下で閉じない(送った操作の結果を見せるため)。backdrop の高さは、React Aria Components が渡す見えている高さ(`--visual-viewport-height`。スマートフォンのキーボードを除いた高さ)にし、中身は backdrop の中に収めて縦に scroll させる(低い画面や拡大で、ボタンに届かなくならないように)。focus は React Aria Components が閉じ込め、閉じたら開いたボタンに戻す。
- **バッジ**(`Badge`):状態を短く示す。用途(`tone`)ごとの色の組は、`Notice` と同じく `/10` の面と、同じ色の線と文字。
- 選んだ状態・今いる場所・ほかの overlay(Popover・Menu・Toast など)の決まりは、その部品を足すときに入れる(選んだ状態は hover より強くし、形でも示す、今いる場所は `aria-current` と形で示す、overlay は border と `shadow-overlay` を付ける)。

## 検査

どの決まりも、文書だけでは守られないので、lint とテストで止める(リポジトリの `DECISIONS.md` の「境界はツールで強制する」)。lint の設定は `tooling/lint/config/admin-classes.ts`、仕組みは `tooling/DECISIONS.md` にある。

### 画面のコード(`ui/` の外)

- 書いてよい class は、子の大きさと見せ方の5つ(`grow`・`shrink-0`・`min-w-0`・`truncate`・`sr-only`)だけ。並べ方(`flex`・`grid`・gap・padding)・文字(`text-*`・`font-*`)・色は、部品と props で決める(`<Stack gap={2}>`・`<Text variant="caption">`・`<Badge tone="danger">` など)。許す側の一覧にするので、新しい class を使いたくなったら、部品を足すか、一覧を足すかを決めることになる。
- `className` には文字列のリテラルだけを渡す。変数や式を渡すと、class の検査が中身を読めない。
- `style` は書かない。
- JSX の props を spread しない(`{...props}`)。spread で渡した `className` や `style` は、検査が見ない(部品でも同じ)。

### 部品(`ui/` と `features/*/ui/`)

- theme.css に無い class(Tailwind CSS の既定の色や目盛りなど)。
- `[…]` の付く class(任意の値・任意のプロパティ・任意の variant)。値は theme.css の役割か、部品の props で決める。`[&>svg]:size-icon` のような子を選ぶ variant も止める。子の大きさは、子の部品の props で決める。
- `(--name)` で CSS 変数を直接読むこと。読めるのは、実行時に決まる値を渡す変数(React Aria Components の `--trigger-width`・`--visual-viewport-height`、`--progress`・`--media-aspect`・`--media-color`・`--focal-x`・`--focal-y`)だけ。型の付いた読み方(`stroke-(length:--progress)`)も許す。部品が `style` で渡せるのは、`css-variables.tsx` で React の型に足した変数だけ。
- `dark:`(light と dark は `light-dark()` で決める。`not-dark:` のような組み合わせた variant の中も)、`!`(variant の後ろも)、生の `data-*:`・`aria-*:`(状態は `is-*:` の variant を使う。生の variant は名前の順に並び、`data-disabled:` が一番弱くなる。打ち間違いも CSS を出すので、無い class でも止まらない。`group-not-aria-*:` のような組み合わせの中も)、数値の `z-*`(`z-10` など)、型を付けた CSS 変数の文字の大きさ(`text-(length:--x)`。色の `text-(color:--x)` は除く)、数値の `font-*`(`font-500` など)、`outline-none`(`outline-hidden` を使う。forced-colors で線が残る)。
- 余白(gap・padding・margin・scroll の padding と margin)の値は 0・0.5・1・1.5・2・3・4・6・8・12 だけ(margin は `auto` も)。正の上と下の margin(`mt-*`・`mb-*`・`my-*` と、上下にも付く `m-*`)と `space-x/y` は使わず、親の gap で空ける。`0` と `auto` は空きを作らないので許す。子の側で空けると、並べ替えや出し分けのたびに空きが崩れる。負の margin は、はみ出させるために許す。
- `leading-*` と、行間を付けない `text-*`(文字の大きさ)。文字の大きさと太さ(`text-sm/xl`・`font-semibold` など)は、`ui/typography.ts` の文字の役割の対応にだけ書く。対応の中で使える組は、役割で使う6つ(`xs/lg`・`sm/xl`・`sm/2xl`・`base/2xl`・`xl/3xl`・`3xl/5xl`)だけ。`text-sm/5` のような数の行間は、`--spacing` の倍数として通ってしまうので止める。
- `--*: initial` の後も Tailwind CSS が作る class(`duration-150`・`delay-*`・`ease-linear`・`ring-2`・`opacity-50`・`bg-linear-*`・`from-*` など)。`opacity-0` と `opacity-100` は、出入りの動きに使うので許す。
- 色の不透明度の修飾は 5・10・15・20・30・40・60・80 だけ(theme.css の色のほか、`current`・`transparent`・CSS 変数の色にも)。面の色(`canvas`・`surface`・`surface-sunken`)には付けない。面は不透明にすると決めているため。
- 色ごとに、使ってよい utility を決める。`surface`・`surface-sunken`・`scrim`・`danger-strong` は `bg-` だけ、`canvas` は `bg-` と、意味の色の塗りの上の `text-`、`line` は `border-`・`divide-`・`outline-` だけ、`focus` は `focus-ring` の中だけ、など(一覧は `admin-classes.ts` の `COLOR_USAGE`)。色を取る utility を列挙すると漏れる(`ring-offset-*`・`text-shadow-*` など)ので、末尾が色の名前の class をすべて見て、決めた utility の外を止める。角丸の `rounded-surface` は、色でないので除く。色を足したら、ここにも決まりを足す(テストで止まる)。
- `className` には、文字列のリテラルか、`tv` などで作った関数の呼び出しを渡す。React Aria Components の render props で値を持つ属性を渡すときは、呼び出しを返す関数(`({ placement }) => popover({ placement })`)にする。変数や条件の式を渡すと、class の検査が中身を読めない。
- `style` には、その場で書いたオブジェクトだけを渡し、キーは `--` で始まる CSS 変数だけにする。見た目は class で書き、`style` は実行時に決まる値を CSS 変数として渡すためだけに使う。画像の縦横比は `width`・`height` の属性で付ける。

### ファイル

- CSS のファイルは `src/ui/` にだけ置き、パレットの変数(`--palette-*`)を読めるのは `theme.css` だけ(`apps/admin/__tests__/theme.test.ts`)。
- `--color-*` と `--text-*` の名前は重ねない。重ねると、`text-<名前>` が色か大きさかを Tailwind CSS が取り違える。文字の大きさと行間は、同じ名前の目盛りにする(同じテスト)。

## 割り切ったこと

- **後から出す `status` の知らせ**:`Notice` の `status` は、中身と一緒に描くので、スクリーンリーダーによっては読まれない(live region は、中身を変える前からあるものが確実に読まれる)。`Notice` はその場に残す知らせで、スクリーンリーダーへの割り込みは要らない。急ぎの誤りは `alert` で読まれる。操作の結果は Toast(React Aria Components が知らせ方を持つ)で知らせる決まりだが、Toast をまだ作っていないので、パスキーの画面では、操作の結果も `status` の `Notice` で出している(追加・削除・名前の変更)。管理者は1人で画面を見て使い、結果は一覧の変化でも分かるので、Toast を足すまでは受け入れる。
- **層の検査が見ない import**:層の境界の lint は、import 文の名前だけを見る。`import("react-aria-components").LinkProps` のような型の中の import と、ほかの層を通した再 export は見ない。どちらも今のコードに無く、追うには依存の木を解く検査が要る。
- **hash の履歴**:`UiProvider` のリンクの `href` は、TanStack Router の `buildLocation` の `href` をそのまま使い、hash の履歴(`createHashHistory`)や URL の書き換えには合わない。管理画面はブラウザの履歴(`createBrowserHistory`)だけを使う。使うときは、`history.createHref()` を通す。
- **検査が見ない class の渡し方**:JSX の属性と、`tv`・`merge` などの呼び出しの中の文字列だけを検査する。DOM を直に触る `element.classList.add()` や `element.style`、`className` に渡した、`tv` で作っていない関数の戻り値は見ない。今の部品にはどれも無く、要る場面が出たら、そこで使える範囲を決める。参照先まで追う検査は、作る手間に見合わない。
- **入力欄の枠の濃さ**:入力欄の枠は `line` で描き、地とのコントラストは 3:1 に届かない(未選択の Checkbox・Switch の枠は `fg-muted` で描くと決めたが、入力欄は決めていない)。入力欄は面(`surface`)と影とラベルで見分けられ、管理者1人が使う画面なので、今は受け入れる。見本の画面ができたら、ユーザーと見直す。
- **dark の削除のボタンを押している間のコントラスト**:pressed の重ね(文字の色を 12%)で、dark の `danger-strong` の塗りの上の白い文字は 4.45:1 ほどになり、4.5:1 にわずかに届かない(hover の 8% では 4.58:1、light では押している間も 5.7:1)。押している間だけの見た目で、文言は押す前に 4.5:1 で読める。dark の塗りも red-700 にすれば届く(押している間も 5.7:1)。
- **Windows の和文の太さ**:Windows の和文の字体には 600 が無いものがあり、600 と 700 の区別がつかないことがある(実機では確かめていない)。管理画面は管理者1人が Mac で使うので、受け入れる(ユーザーが決めた)。公開サイトは、作るときに決める。
