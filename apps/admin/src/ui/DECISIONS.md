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

不透明な色を15個だけ持つ。

| 種類                       | 名前                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| 面                         | `canvas`(画面の地)・`surface`(カード・ダイアログ・入力欄)・`surface-sunken`(サイドバー・表の見出し) |
| 文字と線                   | `fg`・`fg-muted`(補足と placeholder)・`line`(線の既定)・`focus`                                     |
| 塗り                       | `primary`・`on-primary`                                                                             |
| 意味                       | `info`・`success`・`warning`・`danger`                                                              |
| light と dark で変わらない | `scrim`(写真や画面の上の幕)・`on-media`(写真の上の文字)                                             |

- 透明度付きの色の変数は作らない。薄い色は、部品の中で Tailwind の不透明度の修飾(`bg-danger/10` など)で作る。透明度付きの変数を足していくと、同じような色の変数が増える。
- 面の色は不透明にする。`surface-sunken` は sticky の見出しにも使うので、下が透けない。
- 意味の色の塗りの上の文字は `text-canvas` にする(light では白、dark では黒になる)。dark の意味の色は明るいので、白い文字では読めない。
- `black`・`white` という名前は使わず、用途の名前(`scrim`・`on-media`)にする。`bg-white` をカードに、`text-white` を塗りの上に、と書かれやすく、dark の意味の色の塗りの上の白い文字は、コントラストが 1.7〜2.9:1 しかない。
- パレットの値は、shadcn/ui の neutral に合わせる。管理画面の `primary` は白と黒。役割の名前は、自分たちの名前(`canvas`・`surface`・`fg` など)を使う。
- light の意味の色は、薄い面の上の文字でも 4.5:1(WCAG の AA)に届く段にする(red-700・green-800・amber-800・blue-700)。
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
- forced-colors では、役割の変数をシステムの色(`Highlight` など)に差し替える。

## 検査

どの決まりも、文書だけでは守られないので、lint とテストで止める(リポジトリの `DECISIONS.md` の「境界はツールで強制する」)。lint の設定は `tooling/lint/config/admin-classes.ts`、仕組みは `tooling/DECISIONS.md` にある。

### 画面のコード(`ui/` の外)

- 書いてよい class は、子の大きさと見せ方の5つ(`grow`・`shrink-0`・`min-w-0`・`truncate`・`sr-only`)だけ。並べ方(`flex`・`grid`・gap・padding)・文字(`text-*`・`font-*`)・色は、部品と props で決める(`<Stack gap={2}>`・`<Text role="caption">`・`<Badge tone="danger">` など)。許す側の一覧にするので、新しい class を使いたくなったら、部品を足すか、一覧を足すかを決めることになる。
- `className` には文字列のリテラルだけを渡す。変数や式を渡すと、class の検査が中身を読めない。
- `style` は書かない。
- JSX の props を spread しない(`{...props}`)。spread で渡した `className` や `style` は、検査が見ない(部品でも同じ)。

### 部品(`ui/` と `features/*/ui/`)

- theme.css に無い class(Tailwind CSS の既定の色や目盛りなど)。
- `[…]` の付く class(任意の値・任意のプロパティ・任意の variant)。値は theme.css の役割か、部品の props で決める。`[&>svg]:size-icon` のような子を選ぶ variant も止める。子の大きさは、子の部品の props で決める。
- `(--name)` で CSS 変数を直接読むこと。読めるのは、実行時に決まる値を渡す変数(React Aria Components の `--trigger-width`・`--visual-viewport-height`、`--progress`・`--media-aspect`・`--media-color`・`--focal-x`・`--focal-y`)だけ。型の付いた読み方(`stroke-(length:--progress)`)も許す。部品が `style` で渡せるのは、`css-variables.tsx` で React の型に足した変数だけ。
- `dark:`(light と dark は `light-dark()` で決める。`not-dark:` のような組み合わせた variant の中も)、`!`(variant の後ろも)、生の `data-*:`・`aria-*:`(状態は `is-*:` の variant を使う。生の variant は名前の順に並び、`data-disabled:` が一番弱くなる。打ち間違いも CSS を出すので、無い class でも止まらない。`group-not-aria-*:` のような組み合わせの中も)、数値の `z-*`(`z-10` など)、`outline-none`(`outline-hidden` を使う。forced-colors で線が残る)。
- 余白(gap・padding・margin・scroll の padding と margin)の値は 0・0.5・1・1.5・2・3・4・6・8・12 だけ(margin は `auto` も)。正の上と下の margin(`mt-*`・`mb-*`・`my-*` と、上下にも付く `m-*`)と `space-x/y` は使わず、親の gap で空ける。`0` と `auto` は空きを作らないので許す。子の側で空けると、並べ替えや出し分けのたびに空きが崩れる。負の margin は、はみ出させるために許す。
- `leading-*` と、行間を付けない `text-*`(文字の大きさ)。文字の大きさと太さ(`text-sm/xl`・`font-semibold` など)は、`ui/typography.ts` の文字の役割の対応にだけ書く。対応の中で使える組は、役割で使う6つ(`xs/lg`・`sm/xl`・`sm/2xl`・`base/2xl`・`xl/3xl`・`3xl/5xl`)だけ。`text-sm/5` のような数の行間は、`--spacing` の倍数として通ってしまうので止める。
- `--*: initial` の後も Tailwind CSS が作る class(`duration-150`・`delay-*`・`ease-linear`・`ring-2`・`opacity-50`・`bg-linear-*`・`from-*` など)。`opacity-0` と `opacity-100` は、出入りの動きに使うので許す。
- 色の不透明度の修飾は 5・10・15・20・30・40・60・80 だけ(theme.css の色のほか、`current`・`transparent`・CSS 変数の色にも)。面の色(`canvas`・`surface`・`surface-sunken`)には付けない。面は不透明にすると決めているため。
- 色ごとに、使ってよい utility を決める。`surface`・`surface-sunken`・`scrim` は `bg-` だけ、`canvas` は `bg-` と、意味の色の塗りの上の `text-`、`line` は `border-`・`divide-`・`outline-` だけ、`focus` は `focus-ring` の中だけ、など(一覧は `admin-classes.ts` の `COLOR_USAGE`)。色を取る utility を列挙すると漏れる(`ring-offset-*`・`text-shadow-*` など)ので、末尾が色の名前の class をすべて見て、決めた utility の外を止める。角丸の `rounded-surface` は、色でないので除く。色を足したら、ここにも決まりを足す(テストで止まる)。
- `className` には、文字列のリテラルか、`tv` などで作った関数の呼び出しを渡す。React Aria Components の render props で値を持つ属性を渡すときは、呼び出しを返す関数(`({ placement }) => popover({ placement })`)にする。変数や条件の式を渡すと、class の検査が中身を読めない。
- `style` には、その場で書いたオブジェクトだけを渡し、キーは `--` で始まる CSS 変数だけにする。見た目は class で書き、`style` は実行時に決まる値を CSS 変数として渡すためだけに使う。画像の縦横比は `width`・`height` の属性で付ける。

### ファイル

- CSS のファイルは `src/ui/` にだけ置き、パレットの変数(`--palette-*`)を読めるのは `theme.css` だけ(`apps/admin/__tests__/theme.test.ts`)。
- `--color-*` と `--text-*` の名前は重ねない。重ねると、`text-<名前>` が色か大きさかを Tailwind CSS が取り違える。文字の大きさと行間は、同じ名前の目盛りにする(同じテスト)。

## 割り切ったこと

- **検査が見ない class の渡し方**:JSX の属性と、`tv`・`merge` などの呼び出しの中の文字列だけを検査する。DOM を直に触る `element.classList.add()` や `element.style`、`className` に渡した、`tv` で作っていない関数の戻り値は見ない。今の部品にはどれも無く、要る場面が出たら、そこで使える範囲を決める。参照先まで追う検査は、作る手間に見合わない。

- **Windows の和文の太さ**:Windows の和文の字体には 600 が無いものがあり、600 と 700 の区別がつかないことがある(実機では確かめていない)。管理画面は管理者1人が Mac で使うので、受け入れる(ユーザーが決めた)。公開サイトは、作るときに決める。
