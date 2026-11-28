# 決めたことと理由(デザインシステム)

管理画面と公開サイト(Amayadori)で、同じデザインシステムを使う(ユーザーが決めた)。色や文字などの役割は `theme.css`、animation の class と keyframes は `animation.css` に置く。アプリごとに変えるのは1層目のパレットだけで、2層目から下(役割の名前・文字の目盛り・状態・規則)はそろえる。公開サイトへの配り方は、まだ決めていない(リポジトリの `AGENTS.md` の「まだ決めていないこと」)。

## 一覧の先頭から追加する操作

トークン・パスキー・固定ページの追加は、一覧の先頭にある行全体を押せる。固定ページでは取っ手のある行だけを並べ直せる。広い画面では追加の行の高さを一覧の1行に合わせ、狭い画面では44px以上の1行にして一覧を広く使う。トークンとパスキーは、情報と操作が折り返してもほかの行と読み違えないよう、狭い画面で行間を広くする。固定ページはカード間の間隔を保ち、情報と操作の縦の間隔をカードの上下の padding より小さくする。

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

## 幅

- 最大幅は `--max-width-*` で定義し、`max-w-*` で使う。Container query の段は `--container-*` で定義し、`@sm:`(24rem)・`@md:`(28rem)・`@lg:`(32rem) で使う。最大幅と container query の段を個別に調整できるようにする。
- `AppShell` の本文を `@container` にする。本文の中の部品は、サイドバーと本文の padding を除いた幅に合わせられる。ナビの帯とサイドバーの切り替えは viewport の `md:`(48rem) で決める。

## 色

不透明な色を23個だけ持つ。

| 種類                       | 名前                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 面                         | `canvas`(画面の地)・`surface`(カード・ダイアログ・入力欄)・`surface-sunken`(サイドバー・表の見出し)・`surface-muted`(面の上の控えめな塗り) |
| 文字と線                   | `fg`・`fg-muted`(補足と placeholder)・`line`(線の既定)・`line-strong`(入力を受ける部品の枠)・`focus`                                       |
| 塗り                       | `primary`・`on-primary`・`danger-strong`・`on-danger-strong`(取り消せない操作のボタンと失敗の Toast)                                       |
| 意味                       | `info`・`success`・`warning`・`danger` と、その塗りの上の文字の `on-info`・`on-success`・`on-warning`・`on-danger`                         |
| light と dark で変わらない | `scrim`(写真や画面の上に重ねて暗くする色)・`on-media`(写真の上の文字)                                                                      |

- `surface-muted` は、面の中に置く内容の下地(トークンの値の欄、中身の無い欄のアイコンの丸など)に使う。light で neutral-100、dark で neutral-800 にする(dark では `surface` より一段明るい、浮いた下地になる)。ナビの地やドラッグしている行のような、くぼみには `surface-sunken` を使う。この下地の上にも、ほかの面と同じく `fg` と `fg-muted` の文字を載せられる。`surface-sunken` は light で neutral-50 なので、白い面の上ではほとんど見えなかった(ユーザーが見つけた)。`fg` は前景(文字・アイコン)の色なので、薄めて面の塗りに使わない(ユーザーが決めた)。
- 透明度付きの色の変数は作らない。薄い色は、部品の中で Tailwind の不透明度の修飾(`bg-danger/10` など)で作る。透明度付きの変数を足していくと、同じような色の変数が増える。
- 面の色は不透明にする。`surface-sunken` は sticky の見出しにも使うので、下が透けない。
- 意味の色の塗りの上の文字は、色ごとの `on-*`(`on-info` など)にする。今の値はどれも `canvas` と同じ(light では白、dark では黒)。dark の意味の色は明るく、白い文字では読めないため。色ごとに名前を分けておき、塗りによって文字の色を変えたくなったときに、部品を書き換えずに済むようにする(ユーザーが決めた)。
- 取り消せない操作(削除・すべてのセッションからのログアウトなど)のボタンと失敗の Toast(どちらも `danger` の tone)は、`danger` と別の塗り `danger-strong`(light でも dark でも red-700)に、白い文字 `on-danger-strong` を載せる。dark では、暗い面の上の赤い文字が 4.5:1 に届くには明るい赤(red-400)が要り、塗りの上の白い文字が 4.5:1 に届くには濃い赤が要るので、1つの赤では両立できない。red-400 の塗りに黒い文字では色が薄く見えたので、濃い赤の塗りに白い文字にした(ユーザーが決めた)。dark でも red-700 にし、hover で文字の色を重ねても 4.5:1 を割らないようにする。`danger` は、文字・枠・薄い面(`Notice`・`Badge`・入力欄の誤り)の色として残す。名前は `primary` と `on-primary` に合わせる(`on-X` は、`X` の塗りの上に載せる文字の色)。
- `black`・`white` という名前は使わず、用途の名前(`scrim`・`on-media`)にする。`bg-white` をカードに、`text-white` を塗りの上に、と書かれやすく、dark の意味の色の塗りの上の白い文字は、コントラストが 1.7〜2.9:1 しかない。
- パレットの無彩色は、Tailwind CSS の neutral と同じ値にする。管理画面の `primary` は白と黒。役割の名前は、自分たちの名前(`canvas`・`surface`・`fg` など)を使う。
- light の意味の色は、薄い面の上の文字でも 4.5:1(WCAG の AA)に届く段にする(red-700・green-800・amber-800・blue-700)。
- コントラストは、theme.css を読むテスト(`apps/admin/__tests__/theme-contrast.test.ts`)で確かめる。塗りと、その上の文字の組(`on-*`)は、hover の重ねも含めて 4.5:1 に届く。意味の色は、面(`canvas`・`surface`・`surface-sunken`・`surface-muted`)と、その上の `/10` の薄い面の上の文字として、light でも dark でも 4.5:1 に届く。OKLCH を sRGB に直し、sRGB に入らない色は 0〜1 に clamp して計算する。計算は役割の色の定義を読むので、同じテストで、役割の色をほかの場所で上書きしないこと(forced-colors のシステムの色を除く)、`on-*` が、`on-` を除いた名前の塗りと組になること(写真の上の `on-media` を除く)、hover の重ねが文字の色を透明と混ぜたものであることも確かめる。上書きは forced-colors の中だけに許し、そこでは塗りを `Highlight` に、その上の文字を `HighlightText` に差し替えること、パレットの色も1か所だけで定義すること、hover の utility が1か所だけであることも確かめる(CSS のコメントは除いて読む)。どれかが崩れると、計算した色と実際の色が食い違う(Codex と Cursor のレビューで見つかった)。
- dark の `surface-sunken` は、`surface` と別の段(neutral-950)にする。同じ色だと、dark のサイドバーで、今いる場所が見分けられない。
- light の `fg-muted` は neutral-600 にする(ユーザーが決めた)。neutral-500 では、`surface-muted` の上の文字が約 4.35:1 で、4.5:1 に届かなかった。`fg` と `fg-muted` の文字が、どの面の上でも light と dark で 4.5:1 に届くことを、コントラストのテストで確かめる。
- light の `focus` は neutral-500 にする。白に対して 3:1 に届く。
- 枠を使える条件は下の「枠と面の境界」に従う。`border` の既定の色は `line`(light で neutral-300、dark で neutral-700)、入力を受ける部品(入力欄・Checkbox・Radio・Switch・Select など)の枠は `line-strong`(light で neutral-400、dark で neutral-600)で描く。どちらの値も、ユーザーが決めた。文字の色の `fg-muted` を枠に流用しない(役割を混ぜない。ユーザーが決めた)。
- `line-strong` は、入力を受ける部品の専用にする(ユーザーが決めた)。入力を受ける部品は React Aria Components を包むので、どれも `primitives/` にある。`line-strong` の class を書けるのは `primitives/` だけで、patterns・layout・`features/*/ui/`・`components/*/ui/` では書けない(lint で止まる)。
- border の色は、`theme.css` の base の層(`@layer base`)で `line` を既定にする。線を引くときは幅の class(`border`・`border-s`・`border-b` など)だけを書き、`border-line` は書かない。色の class を書くのは、`line` のほかの色(`line-strong`・意味の色・`transparent` など)にするときと、`tv` の variant や状態の variant(`is-*:`)でほかの色にした線を `line` に戻すときだけにする(ユーザーが決めた)。既定と同じ class が並ぶと、どこで色を変えているのかが読み取りにくい。

### 枠と面の境界

- **目的は、色を喧嘩させないこと**(ユーザーが決めた)。不透明の線は、下や隣に来る写真・色の面・背後を通る中身と色がぶつかる。そういうコンテンツに接しうる線は、半透明にして、コンテンツの上に重ねる。
- **CSS の `border` は、Figma の stroke と同じものではない。** stroke は inner・center・outer のどれでも、ほかのコンテンツの上に重なる。`border` は場所を取り、子の上には重ならない。線が要るときに、`border` から考え始めない。
- **線を引く前に、線の内側と外側に何が来うるかを見る。** 写真、色の面、半透明の面、スクロールで背後を通る中身のどれかが来うるなら、下の「領域の区切り」「浮いた面の縁」「子の上に重ねる縁」から選ぶ。`border` の class を書けるのは、内側も外側も無地と確定していて、枠が主体の部品だけ。
- **領域の区切り**(バーやパネルの1辺)。`separator-t`・`separator-b`・`separator-s`・`separator-e` で描く。中身は、色を `fg` の 18% に固定した半透明の `border`。`surface` の上では `line` とほぼ同じ濃さになり、面が半透明でも、背後を通る中身の上で濁らない。両側が無地か、中身が下を通るかを、使うたびに判断しないで済むよう、区切りはいつもこの utility で描く(ユーザーが決めた)。1つの要素に引けるのは1辺で、後から当たった辺が前の辺を消す(`separator-t md:separator-s` と書ける)。
- **浮いた面の縁**。Dialog・Popover・drawer は、面の外側に `fg` の 10% の線を重ねる `edge-outer` で描く。写真や本文が背後を通っても、縁の色が周囲になじむ。不透明の `border` は、背景の色と混ざってぼやけ、塗りの外に枠を足したように見えた(ユーザーが決めた)。`edge-outer` は `outline` で描くので、focus の ring を出す要素には使えない。その要素では、同じ線を `::after` に描く(ナビの行、並べ直せる一覧の行)。`Modal` の見出しと下端の帯は背景のぼかしで本文との重なりを示し、境目を強めるための線は引かない。写真に重ねる案内にも、Dialog と同じ面と縁を使う。
- **子の上に重ねる縁**。写真のように色を持つ子を入れた箱の内側に線を引くときは、`::after` を `inset-0` で重ねる。箱に `outline` と負の offset を付ける書き方は、子が `position` か `transform` を持つと子に隠れる。inset の `box-shadow` は、子にも、`<img>` 自身の画像にも隠れる。`<img>` 自身に線を付けるときは、`outline` と負の offset で画像の上に出せる(どれも Chromium で描いて確かめた)。
- **枠が主体の部品**。入力できる範囲、ドロップ先の広さ、どの領域が空かを輪郭そのもので伝える部品は、`border` で描く。入力欄・Checkbox・Select は `line-strong` と不透明な面を組にする。破線の Button は選択・ドロップできる範囲、EmptyState の破線は中身が置かれる範囲、ErrorState の実線は取得に失敗した範囲を示す。
- **Notice と枠付きの Badge**。薄い塗りと同じ色相の線を `border` で引く。無地の面にだけ置き、写真やほかのコンテンツの上に重ねない(ユーザーが決めた)。
- **線が図形や状態を表す場合**。固定ページの枝線は項目の親子関係、Spinner の円弧は処理中を表す。写真に使う `drop-target` の青い輪郭は、ファイルを重ねている間だけ、落とすと公開される領域の内側を囲む。強制配色ではシステムの選択色を使う。フォーカスの輪郭には `focus-ring` を使う。forced-colors でも必要な状態が識別できるかを確かめる。ScrollView のつまみは背景色で識別できなくなる forced-colors のときだけ、つまみの辺に線を描く。
- **写真の選択マーク**。選択済みの緑の円には、白い 2px の輪郭を付ける。白い写真では緑の面、緑の写真では白い輪郭で選択状態を識別できる。forced-colors ではシステム色の outline で円を示す。
- lint は、border・divide・outline の class を、部品ごとに許可した辺・状態・色だけ通す(`tooling/lint/config/admin-borders.ts`)。`separator-*` と `edge-outer` は、どの部品にも書ける。許可する class を足す前に、線の内側と外側に来うるものと、上の utility で描けない理由を確かめる。背景の実際の組み合わせと色の調和は、その部品を置いた Story で確認する。

## light と dark

- 役割の色は、`light-dark()` で、light と dark にパレットのどの段を使うかを1つの定義に持つ。`dark:` の variant は使わない。1つの定義なら、light だけ直して dark を直し忘れることがない。
- 利用者が配色を選んだら、html の `data-theme` で `color-scheme` を固定する。選んでいなければ OS に従う。
- 部分だけを dark(light)にするときは `scheme-dark`(`scheme-light`)を使う。画面の配色に対して部分だけを逆にするときは `scheme-inverse` を使う。html に `data-theme` があればその配色を、無ければ OS の配色を反転する。`color-scheme` を変えるだけでは、`:root` から継いだ文字の色が評価し直されないので、文字の色も入れ直す。
- Vite の `build.cssTarget` は、管理画面が対応するブラウザ(`apps/admin/DECISIONS.md`)に合わせて `esnext` にする。`build.target` と `build.cssTarget` の両方を書かずに Vite の既定(`baseline-widely-available` の古いブラウザ)に任せると、圧縮のときに Lightning CSS が `light-dark()` を `--lightningcss-light`・`--lightningcss-dark` の変数に書き換え、`scheme-dark` で部分だけを dark にすると効かなくなる。本番のビルドの出力に `--lightningcss-` が無いことを、テスト(`apps/admin/__tests__/vite-config.test.ts`)で確かめる。

## 文字

- 文字の大きさ(`--text-*`)と行間(`--leading-*`)を、同じ名前・同じ値の目盛りにする(`xs` 12・`sm` 14・`base` 16・`lg` 18・`xl` 20・`2xl` 24・`3xl` 28・`4xl` 32・`5xl` 36)。必ず `text-sm/xl`(14px の文字に 20px の行間)のように組で書く。大きさと行間を別々の目盛りにすると、組み合わせを毎回選ぶことになる。
- 本文・見出し・補足といった文字の役割は、CSS の変数にしない。`Text`・`Heading` の部品が、役割ごとに目盛りの組と太さを選んで守る。
- 太さは 400・600・700(`font-normal`・`font-semibold`・`font-bold`)だけ(ユーザーが決めた)。
- 和文を主役に組む。`:lang()` で言語ごとに字体を切り替え、本文を出す要素には本文の言語の `lang` を付ける。`lang` の付いた要素では、字体を一度既定に戻してから言語ごとに上書きする。規則の無い言語(`ko` や繁体字など)が、親の和文の字体を継がないようにするため。
- 禁則(`line-break: strict`)・和文と欧文の間の空き(`text-autospace`)・日本語の文節での改行(`word-break: auto-phrase`)は CSS に任せる。等幅の要素(`code`・`kbd`・`samp`・`pre`)では、空きを入れると桁がずれるので `text-autospace` を切る。日本語では、行頭の始め括弧(「 など)の前の空きを詰める(`text-spacing-trim: trim-start`)。`lang` の付いた要素では既定に戻してから言語ごとに当て(字体と同じ)、等幅の要素では詰めない(桁がずれる)。等幅の要素の指定は、`:lang(ja)` より詳細度を上げる(`:is(code, kbd, samp, pre):lang(ja)`)。要素の名前だけで書くと、`:lang(ja)` の `trim-start` に負けた(Copilot のレビューで見つかった)。既定では行頭の「が全角の幅のままで、「で始まる見出しが、本文より半角ぶん右に寄って見えた(Storybook の Dialog で見つけた)。

## 状態

- hover は、その要素の文字の色(`currentColor`)を薄く重ねる utility(`state-hover`)で表す。塗りのボタンでも、透明な行でも、どの面の上でも同じに働く。`background-image` を使うので、`bg-linear-*` と一緒には使えない。
- pressed は `state-pressed` で、要素の大きさを保ったまま `translate` で 1px 下に沈める。押している間に色を変えると、ナビのリンクを click してから画面が移るまでに色が何度も変わってちらついたので、色は変えない。scale も使わない(どちらもユーザーが決めた)。部品は `transition` で、色と位置を、押したときも離したときも、既定の長さ(120ms)と曲線(`--ease-standard` と同じ値)で動かす。数値の入力欄の増減のボタンは、入力欄の枠の一部なので沈めない(沈めると、枠からずれた)。
- 閉じるボタンのように色の付いた面の上に載る操作は、`focus-ring-current` で文字の色(`currentColor`)の focus の ring を描く。赤い面の上では `focus` の灰色が見えにくいため。
- 状態の variant(`is-hovered`・`is-selected`・`is-disabled` など)は、部品のライブラリが付ける属性に名前を付けたもの。`theme.css` に、勝たせたい順に並べ、無効を最後に置く。生の `data-*:` の variant は名前の順に並ぶので、`data-disabled:` が一番弱くなる。値を持つ属性(並べ替えの向き・placement・orientation など)は variant にせず、部品の render props から渡す。公開サイトでは、そちらの部品のライブラリの属性に合わせて、同じ名前で定義し直す。
- `is-current` は `aria-current` も見るので、`:where()` で包んで、ほかの variant と詳細度をそろえる。包まないと `is-disabled` に勝つ。
- reduced motion では、base で transition を一律に止める。animation は見せ方が部品ごとに違うので、部品が使う class で決める。spinner は `motion-reduce:` で `animate-pulse` に替える。`animation.css` で Dialog の scale を `1` に固定し、引き出したナビと画面が浮かび上がる動きは opacity だけを変え、遷移の帯は流さずに全幅で止めて出す。
- forced-colors では、役割の変数をシステムの色(`Highlight` など)に差し替える。塗りの `danger-strong` と `on-danger-strong` は、`primary` と `on-primary` と同じく `Highlight` と `HighlightText` にする。

## 部品の層

| 置く所                  | 中身                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `tv.ts`                 | デザインシステムの class の組を設定した `tv` と `merge`                                               |
| `typography.ts`         | 文字の役割と、目盛りの組と太さの対応(組を書けるのはここだけ)                                          |
| `primitives/`           | ボタン・リンク・入力欄・`Notice` など、いちばん小さな部品。React Aria Components を使えるのはここだけ |
| `layout/`               | 並べ方(`Stack`・`Cluster`・`Center`・`AppShell`)と文字(`Text`・`Heading`)                             |
| `patterns/`             | primitives と layout を組み合わせた、画面に共通の形(`PageHeader` など)                                |
| `features/<名前>/ui/`   | 1つの画面だけの部品(`ui/` と同じ決まり)                                                               |
| `components/<名前>/ui/` | 複数の feature が使う、管理画面に固有の部品の見た目(`ui/` と同じ決まり)                               |
| `specimens/`            | 色と文字の見本と、story の展示用の枠(`story-stage.tsx`)。Storybook で見る                             |

- import の向きは、patterns → primitives・layout。layout は primitives と patterns を、primitives は patterns を import しない(lint で止まる)。layout は並べ方と文字だけを持つ層で、操作を持たない。
- `layout/`・`patterns/` と、`primitives/` の入力欄・図形・ナビ・overlay・並べ直せる一覧(`collections/`)の各フォルダには、フォルダの外から使う部品・hook・型を `index.ts` にまとめる。たとえば、画面では `@/ui/layout` から `Stack` と `Text` を一度に import できる。各フォルダで部品の実装に使うもの(余白の型、入力欄の枠、`ShowToastContext` など)は入口に含めない。`primitives/` 直下と `ui/` には、フォルダごとの責務が分かる import を保つため、まとめた入口を置かない。
- React Aria Components(`react-aria`・`react-stately`・`@react-aria/*`・`@react-stately/*`・`@internationalized/*` と、型だけの import も)を import できるのは `primitives/` だけ。primitives は、React Aria Components の props の型を extends せず、自分の props の型を持つ。画面のコードに、ライブラリの props(`className` の関数や、`data-*` の render props など)を見せない。ライブラリを替えるときに直すのは primitives だけになる。
- UI の外部ライブラリは、`ui/` の部品で包む。lucide-react を import できるのは `primitives/` だけで、ほかの層は `Icon` に名前を渡す(ユーザーが決めた)。
- `tailwind-variants` は `tv.ts` だけが import し、ほかは `tv.ts` の `tv` と `merge` を使う(lint で止まる)。既定の入口の `tv` は theme.css の名前を知らず、`z-sticky z-overlay` のような theme.css の名前の組を merge できずに両方残す(後から渡した class で上書きできない)。
- merge の設定には、`theme.css` と `animation.css` の名前を入れる。名前ごとに「同じ組の2つを渡すと後だけが残る」ことと、`@utility` ごとに組の相手を決めてあることを、CSS を読むテスト(`apps/admin/__tests__/tailwind-merge.test.ts`)で確かめる。名前が1つしかない組(`grid-cols-thumbnails`・`aspect-photo`)は、Tailwind CSS の既定の class を相手にする。`tv` の variant を通しても merge が効くことを確かめる。`state-pressed` は `translate` の組に入れ、`state-hover` と一緒に渡しても両方残す。`state-disabled` は透明度と押せるかどうかを変えるだけなので、hover や pressed とは組にしない(組にすると、`state-hover state-disabled` で hover の見た目が消える)。
- 文字の役割と組:`body`(`text-sm/xl`・400)・`body-long`(`text-sm/2xl`・400。長い文)・`caption`(`text-xs/lg`・400)・`label`(`text-sm/xl`・600)・`section`(`text-base/2xl`・600)・`dialog`(`text-lg/2xl`・700)・`page`(`text-xl/3xl`・700)・`display`(`text-3xl/5xl`・700)。`Text` と `Heading` は、文字の役割を `variant` で受ける(`role` にすると、ARIA の `role` と取り違える)。`Heading` は見出しのレベル(h1〜h3)から役割の既定を決め(レベル 1 は `page`、2 と 3 は `section`)、見た目とレベルを別々に選べる。
- `ui/` は、管理画面の業務と配線を知らない(ユーザーが決めた)。`@/api`・`@/app`・`@/components`・`@/features`・`@/preferences`・`@/queries`・`@/routes` と、contract・oRPC・TanStack のライブラリを import しない(lint で止まる)。値は props で受ける。部品に業務の知識(アプリのライブラリの状態や型、API の形、決まった文面)を足すのは、`ui/` の外の層(`apps/admin/DECISIONS.md` の「業務の知識を足す層」)。画面の名前も持たない(CSS は、属性と変数の約束だけを持つ)。TODO: 部品が持つ文言(「閉じる」「読み込み中」など)を引くための `@/i18n` と react-i18next への依存は、扱いをユーザーと決める。
- `UiProvider`(`primitives/ui-provider.tsx`)は、React Aria Components に、言語(`I18nProvider`)と、行き先へ移る関数(`RouterProvider`)を渡す。どちらも props で受け、対応する言語の一覧も、router も知らない。今の言語と TanStack Router につなぐのは、アプリの側(`src/app/connected-ui-provider.tsx`)。部品が言語を要るのは、React Aria Components が、内蔵の文言(並べ直しの取っ手、Toast の region)と、日付や数の並びを、言語で決めるため。リンクの行き先(`href`)は、文字列で受ける。どんなパスがあるかは、アプリの知識なので、`ui/` の型に持ち込まない(React Aria Components に、アプリの route の型を登録しない)。route を知っている `routes/` が、行き先を型付きで作って渡す(`apps/admin/DECISIONS.md` の「業務の知識を足す層」)。React Aria Components は行き先を文字列で渡すので、アプリは `href` として TanStack Router に渡し、path を読ませる。

### 部品の決まり

- **スクロール領域**:内容の横や下に操作できるスクロールバーを出すときは `ScrollView` を使う。スクロールはブラウザに任せ、つまみとレールには内容と重ならない場所を取る。OS がスクロールバーを内容に重ねる設定でもこの間隔を保てる。内容が収まればバーとその場所を外す。つまみは領域にポインタが入ると表示し、離れてから5秒後に隠す。レールの線は描かず、つまみにポインタを重ねると色を濃くする。キーボードでバーに focus している間もつまみを表示する。端の操作にも focus が見えるよう、内容の中の focus ring は内側に描く。`Modal` では `inset="modal"` で内容の両端とレールを見出しの padding にそろえる。 `snap` を付けると、横方向の中身を領域の左端(`inset` の余白の位置)に1つずつ止める。中身の後ろには領域の幅の余白を足し(`snap-rail-strip`)、末尾も左端に止められるようにする。止める1つ分は `SnapItem` で包む。

- **塗りのボタン**:`border border-transparent` を付ける。forced-colors で、塗りが消えても線として残る。
- **押せない・送信中**:見た目(`state-disabled` など)だけでなく、React Aria Components の props(`isDisabled`・`isPending`)で動きを止める。CSS の `pointer-events` はキーボードの操作を止めない。送信中のボタンは、focus を残したまま押せなくし、spinner を、訳した名前の付いた `ProgressBar` の中に出して、待っていることをスクリーンリーダーに伝える(spinner だけでは、スクリーンリーダーはボタンの名前しか読まない)。送信中も、ボタンの幅を変えない(ユーザーが決めた)。spinner を文言の横に足すと、幅が spinner と間の分(24px)だけ広がり、右寄せで並んだ隣のボタンが押し出される。文言とアイコンを1つの格子のセルに置き、送信中は `opacity-0` で隠して場所を残し、spinner を同じセルに重ねる。`invisible`(`visibility: hidden`)で隠すと、文言がボタンのアクセシブルな名前から外れ、送信中の名前が「処理中」だけになる(Chrome で確かめた)。spinner は `block` にし、`ProgressBar` の箱を spinner の大きさにして、セルの `place-items-center` で文言の中心にそろえる(`inline-block` では、行の高さの箱の中で baseline に載り、文字より 2〜3px 上にずれる)。React Aria Components は送信中のボタンを `type="button"` に変えるので、入力欄の Enter がフォームを送り直せる。`Form` にも `isPending` を渡し、送信中は送らない(管理画面の「送信中はボタンを無効にする」)。 写真の前後へのリンクは、待機中だけ行き先を外し、同じ a 要素に focus を残して無効状態を伝える。React Aria の Link は無効にすると span に変わるため、ここは HTML の a を使う。 写真の切り替え中は3つの操作を fieldset で止め、ボタンの位置と色を保つ。
- **長い語の折り返し**:`Text`・`Heading`・Dialog の見出しは `wrap-anywhere`(`overflow-wrap: anywhere`)にする。 1行に収めたい場所(ファイル名とバッジを並べる行など)では、`Text` の `truncate` で折り返さずに省略し、`Cluster` の `wrap={false}` で並びも折り返さない。パスキーの名前のような利用者が付けた文字列は、空白の無い長い英数字でもよいので、語の途中でも折り返し、狭い画面や拡大で横にはみ出さないようにする(flex の中でも、min-content の幅が縮む)。happy-dom は配置を計算しないので、テストでは確かめない。
- 写真の帯で使うサイズ `sm-to-md` は狭い画面で1段小さくし、文言を1行に保ってボタンの並びを折り返す。隣と間隔を空け、タップできる範囲は見た目の外側まで広げる。ほかの文言のあるボタンは、折り返した文言の高さまで伸ばす。小さい画面で文字を拡大したときも、押せる範囲に名前が収まる。
- **ファイルを渡す追加ボタン(`FileDropButton`。`primitives/collections/file-drop-button.tsx`)**:一覧の先頭の追加と同じ破線の形で、押すとファイルを選ばせ、ファイルを落としても渡せる。React Aria Components の `FileTrigger` と `DropZone` を包む。`DropZone` は、キーボードで貼り付けるための見えないボタンを持ち、そこに focus があるときと、ファイルを重ねているときは、ボタンの外に focus の ring と地の色を出す。一覧の先頭に置く追加の操作なので、`primitives/collections/` に置く(`primitives/` の直下は10件で埋まっている)。
- **1件ずつ進める作業の一覧(`ProgressList`・`ProgressRow`)**:写真を送る・取り込むような、1件ずつ進める作業の名前・補足・状態のバッジ・操作(送り直すなど)を並べる。終わった行は名前から開ける。行は文字列と真偽値と、描き直しで変わらない関数だけを受け、呼ぶ側が行を `memo` で包めば、ほかの行の変化で描き直さずに済む。
- **面の内側のボタンの角**:角の丸い面(固定ページの要素の帯など)の内側に、間を空けて置くボタンは、角の丸みを `rounded="xs"`(4px)にする。帯の丸み(8px)から間(4px)を引いた丸みにして、外と内の角の曲がり方を連続させる(ユーザーが見つけた)。
- **ボタンのアクセシブルな名前**:並んだ要素ごとの「上へ」「削除」のように、文言だけでは何に対する操作か分からないボタンには、`aria-label` で対象を含めたアクセシブルな名前を付ける(「リンク 2 を上へ」)。名前には見える文言を含め、音声入力で見える文言を言って押せるようにする。文言に対象を書き込むと、同じ対象の名前がボタンごとに並び、見た目が重くなる。文言の代わりにアイコンだけを出すボタン(`icon`)は、名前が無くなるので `aria-label` を型で必須にし、正方形(`aspect-square`。高さは `size` のまま)にする。
- **中身を包むリンク**(`Link` の `variant="block"`):写真と文字のように、まとまった中身を1つのリンクにする。focus の ring は中身の全体を角丸で囲み、押すと沈む。hover の見せ方は中身の側で決められるよう、`group` を付ける(写真の上に `scrim` を薄く重ねるなど)。
- **リンク**:文の中のリンクは、いつも下線を付ける。`primary` が中立色なので、色だけではリンクと分からない。前の画面へ戻るリンク(`variant="back"`)は、文言の前に chevron を置き、下線を付けない(ユーザーが決めた)。chevron で戻るリンクと分かり、下線は svg に引けないので、付けると文言の下だけで途切れる。色は `fg-muted` にし、hover で `fg` にする。chevron は名前に入れない。chevron は 16px の枠の真ん中に細く描かれるので、枠を左へ 6px はみ出させて字面の左端を見出しの左端にそろえる。文言との間には `gap-1` を置く。chevron の枠内の余白と合わせると、ナビのアイコンと文言の間隔にそろう。
- **入力欄**:ラベル・補足・誤りの知らせを、React Aria Components の slot で入力欄に結びつけ、補足と誤りを入力欄の説明として読み上げさせる。誤り(invalid)のときは、枠も focus の ring も `danger` にする(forced-colors では、ring をシステムの `Highlight` のままにする。`danger` で上書きすると、focus の前後で見分けられなくなる)。ring だけ `focus` の灰色のままだと、赤い枠の外に灰色の輪が重なって見えた(Storybook でユーザーが見つけた)。server が断った入力は、`Form` の `validationErrors` で入力欄ごとに出す。入力欄(`TextField`・`TextArea`・`NumberField`)は `primitives/form-fields/` にまとめ、ラベル・補足・誤りの知らせと、枠の見た目を共有する。
- **入力例とガイド**。`TextField`・`TextArea` の `placeholder` には空欄に表示する入力例を渡す。文字数の上下限、使える文字や形式など、入力中も必要な案内は `description` に渡し、欄の下に残す。ラベルで足りる欄では省く。ガイドはできるだけ1行で読める長さにする。英語は簡潔に書き、文にはピリオドを付ける。中国語・日本語・韓国語のガイドは末尾に句点を付けない。入力ガイドの訳にはキーの用途を表す `<画面名>.guide.<入力欄の名前>` を使う。共通の文字数表示は `ui.guide.*` に置く。翻訳カタログでは、中国語・日本語・韓国語のガイドの末尾を検査する。Story のテストでは、実際に描画した言語のガイドに同じ判定を適用する。狭い画面では折り返して条件を最後まで見せる。
- **「必須」のラベル**:入力が要る欄のラベルには、文字の「必須」のラベル(`RequiredBadge`)を添える(ユーザーが決めた)。`*` だけでは、意味を知らない人に伝わらない。見た目は、`Badge` の `danger` の `soft`(薄い赤の面に赤い文字。線は見せない)にする(ユーザーが決めた)。大きさは `caption` の文字に透明の線を足して 20px の高さになり、ラベルの1行の高さ(`label` の 20px)と同じなので、どちらも上にそろえれば中心がそろう。ラベルが長いと文字だけが折り返し、「必須」は1行目の右に残る(文字に `min-w-0` と `wrap-anywhere` を付ける)。読み上げは入力欄の `required`(`aria-required`)が「必須」を伝えるので、「必須」の文字は `aria-hidden` で読み上げから外し、入力欄の名前にも含めない。含めると「名前 必須、必須」と重ねて読まれる。ラベル付きの入力欄は、「必須」の文言を `requiredLabel` で受け、渡されたときに入力を必須にする(必須の状態と、ラベルの文言を、別々に渡して食い違わせない)。文言は、`ui/` が訳を引かず、呼ぶ側が渡す。Select の placeholder と「選択なし」、日付が未完のときの知らせ、数値の増減のボタンの名前も、props で受ける。
- **送信の検証で止めたときの focus**(`focusFirstInvalidField`):範囲の中で、React Aria Components が `data-invalid` を付けた最初の欄の外枠を見える位置まで scroll し、欄の中の Tab で届く要素に focus を移す。React Aria Components の部品でないまとまり(固定ページの group など)も、外枠に `data-invalid` を付ければ対象になる。外枠が `tabindex` を持つときは、外枠そのものに focus を移し、まとまりの見出しと誤りを読ませる。保存の失敗を知らせる上部の Toast で見出しが隠れないよう、まとまりの見出しを画面の中央に表示する。使い方とつなぎは `../components/forms/DECISIONS.md` の「送信の検証で止めたときの focus」にある。
- **1行のテキストの入力欄(`TextInput` と `TextField`)**:`TextInput` は入力操作と枠を持ち、`TextField` がラベル・補足・誤りの知らせを結び付ける。フォームの状態を持つ部品とのつなぎは `../components/forms/DECISIONS.md` にある。React Aria Components の `isInvalid` に `false` を渡すと、必須の検証や `Form` の誤りの知らせを上書きする。未指定の `value` や `isInvalid` を React Aria Components に渡さないため、入力欄の部品は、指定された props だけを持つオブジェクトを作って spread する。
- **長いテキストの入力欄(`TextArea`)**:初めから4行分の高さを取り、縦に resize できるようにする。入力欄の幅をそろえたまま、利用者が長い文を見渡せるようにする。
- **数値の入力欄(`NumberField`)**:表示は React Aria Components が言語に合わせて整え、`FormData` には桁区切りの無い値を入れる。表示にも桁区切りを入れない。入れると、年のような数が「2,014」と出る。金額のように桁区切りが要る欄を作るときに、その欄で入れるかを決める(ユーザーが決めた)。数値の項目の値には小数の桁数に上限が無いため、入力欄を出るときに Intl の既定で小数が丸まらないよう、有効数字を17桁まで使う。増減はボタンと上下の矢印キーで行い、フォームを scroll するときに値が変わらないよう、ホイールでの増減は切る。入力欄と増減ボタンを1つの枠に収め、どこに focus があっても枠全体で示す。増減ボタンの名前は、呼ぶ側から受け取る。フォームの層(`components/forms`)は、管理画面の訳から、どの入力欄の値を増やすか、減らすかを自然な語順で伝える名前を作って渡す。
- **Checkbox**。保存時に反映する真偽値に使う。チェックのマークは、16px の箱に合わせて `viewBox` を 16×16 にした SVG の線(太さ 1.75px)で描き、箱の中心にそろえる。`Icon` の `check`(lucide-react。`viewBox` は 24×24)を箱の大きさに縮めると、線が 1.2px ほどに細くなり、腕が箱の縁の近くまで伸びて、ラベルの太さと釣り合わなかった(ユーザーが見つけた)。ラベルを CheckboxButton の中に置き、ラベルでもチェックを切り替えられるようにする。単独のフォームでは HTML と同じくチェックした値だけを送る。種類の定義の真偽値は `false` も有効な値なので、チェックの必須とは分ける。
- **Select**。選択肢のラベルと値を分け、選択中の行にチェックを付ける。任意の Select には「選択なし」を置き、選んだ後も空に戻せるようにする。選択肢の一覧(`overlays/list-box-popover.tsx`)は、ナビの選択と共有し、ボタンと同じ幅にして、画面に収まる高さで scroll させる。エラーは React Aria Components の slot でボタンに説明として結び付け、ボタンの枠と focus ring にも同じ状態を反映する。
- **ナビの選択(`NavSelect`)**:ナビの下の段で、言語と配色のような、選ぶとその場で当たる値を選ばせる。行はナビのリンクと同じ形(高さ・左右の余白・アイコンと文言の位置)にし、アイコン・今の値・上下の矢印(`chevrons-up-down`)を並べる。何を選ぶ行か(「言語」「配色」)は行に書かず、アイコンと、開いた一覧の見出しで示す(ユーザーが決めた)。名前まで並べると、一番長い値で行が幅いっぱいになり、ナビのほかの行と形がそろわなかった。読み上げでは、React Aria Components が、今の値と何を選ぶ行かをボタンの名前にする(「日本語 言語」)。一覧は行の上に開き、各行のアイコン・ラベル・チェックを、開いた行のアイコン・文言・矢印と同じ縦の線にそろえる(一覧の見出しは、ナビのまとまりの見出しと同じく、アイコンの線)。React Aria Components は一覧を開いている間もボタンを押した状態にするので、ほかのナビの行のように沈めず、hover と同じ見た目にする。選択肢が増えても形が変わらないよう、ボタンを並べる形(ToggleButtonGroup)にはしない。アイコンだけのボタンでは、自動の意味が伝わりにくかった。今の値を選び直したときも、その値を保存する。別のタブで保存した値と、このタブの表示が違うことがあるため。React Aria Components の Select は同じ値で `onChange` を呼ばないので、その場合は選択肢を押して確定したことを受け取る。
- **画面の言語と違う言語の文**:選択肢のラベルを画面の言語と違う言語で書くとき(言語の名前など)は、選択肢に `lang` を付け、字体と読み上げにその言語を使う。付けないと、日本語の画面で「简体中文」が和文の字体になる。
- **日付の入力欄(DateField)**。年・月・日を入力する順と読み上げは React Aria Components が言語に合わせる。日付は時刻やタイムゾーンを含まない `YYYY-MM-DD` で渡す。日付の一部だけが入力された状態で欄を出たら、React Aria Components が公開する segment の状態からエラーを出す。直すまでブラウザの検証で送信を止め、欄に見えていない前の日付が保存されるのを防ぐ。日付だけを扱う欄でも、時刻の表し方(`hourCycle`)を 24 に固定する。React Aria Components は、言語ごとに 12時間制と24時間制を選び、それが変わると入力途中の値を作り直すので、年だけ入れた後にナビで言語を替えると、入れた年が消えた。
- **`Notice`**:誤り(`danger`)は `alert` にしてすぐに読み上げ、ほかは割り込まない `status` にする。`Notice` は、その場に残す知らせ(もう無いページ、セッションを確かめられなかった画面など)に使い、操作の結果は、固定ページの作成・更新の成功を除き、成功も server の応答で分かる失敗も Toast で知らせる。どちらで知らせるかは、`apps/admin/DECISIONS.md` の「知らせの出し分け」にある。
- **見出しの操作と補足**:`PageHeader` は、`false`・`null` の操作と、空の補足を、無いものとして扱う(条件で出さない操作のために、空の要素が余白を取らないように)。操作のボタンの中心は、見出しの1行目の中心にそろえる。上にそろえると、ボタン(`h-control` の 36px)が見出しの行(`page` の 28px)より高いぶん、4px 下にずれた(Storybook で見つけた)。見出しの上を `pt-1`(差の半分)空け、見出しの位置は、操作の有無で変えない。操作を負の margin で上げると、狭い画面で操作が次の行に折り返したときに、見出しとの間が詰まる(Codex のレビューで見つかった)。
- **`Notice` のアイコン**:`icon` を渡すと、1行目の先頭にアイコンを置く。アイコンは、本文の1行の高さ(20px)の枠の中央に置き、1行目の文字と縦の中心をそろえる。使う側が `Cluster` で並べると、アイコン(16px)が行の上端に寄って、文字と中心がずれた(ユーザーが見つけた)。2行目からは、文字の左端をそろえる。
- **`Dialog` と `Modal` を分ける**(ユーザーが決めた):確認や短い入力には `Dialog`(`primitives/overlays/dialog/`)、写真の追加や画像の選択のような、ひとまとまりの作業には `Modal`(`primitives/overlays/modal/`)を使う。1つの部品の variant で両方を賄うと、見出し・本文・フッターの余白が、渡した props の組み合わせで決まり、フッターに何も置かない状態で下の余白が左右とずれた。処理中から成功に切り替わる中央の表示は `StatusDialog` に分ける。backdrop とパネルの面は、3つとも `OverlayFrame`(`overlay-frame.tsx`)で描く。
- **`Modal`**:見出しと下端の帯の間で本文をスクロールする。見出しは半透明の面で背後の本文をぼかし、右に閉じるボタンを置く。下端の帯は、置く内容が無くても必ず描き、本文の下の余白を左右と同じ 24px にする(内容が無い帯は landmark にしない)。帯そのものは透明で、`start` と `end` はそれぞれ補足文・リンク・操作など任意の内容を受ける。左右どちらでも、`ModalActions` で包んだ操作のまとまりだけ背景をぼかす。空いた場所では本文が見え、操作やスクロールも届く。透明度を下げる設定ではぼかす面を不透明にする。見出しと帯の高さは scroll-padding に反映し、focus を移した入力欄が帯の下に隠れるのを防ぐ。本文の両端は `ModalSection` で見出しとそろえる。写真などを広く一覧する場合は `width="page"` を使う。
- 本文のフォームと、`Modal` の下端の帯の送信ボタンは、フォームの `id` とボタンの `form` で関連付ける。入力の検証と送信に通常のフォームと同じ経路を使える。表示領域が低いときはヘッダーとフッターも本文と一緒にスクロールし、拡大表示で入力欄が隠れるのを防ぐ。
- **`Dialog`**(`primitives/overlays/dialog/dialog.tsx`):地の上に重ねる半透明の線と `shadow-overlay` を付け、地を `bg-scrim/40` の backdrop で覆う。dark では scrim がほとんど効かないので、半透明の線で地と分ける。送信中は、Escape と backdrop の押下で閉じない(送った操作の結果を見せるため)。`isDismissable` を `false` にすると、backdrop の押下では閉じず、Escape と閉じるボタンでだけ閉じる。一度だけ見せる token のように、押し損ねで閉じると取り戻せない中身に使う。backdrop の高さは、React Aria Components が渡す見えている高さ(`--visual-viewport-height`。スマートフォンのキーボードを除いた高さ)にし、中身は backdrop の中に収めて縦に scroll させる(低い画面や拡大で、ボタンに届かなくならないように)。focus は React Aria Components が閉じ込め、閉じたら開いたボタンに戻す。
- **`Dialog` の animation**:開くときは 200ms、閉じるときは 150ms。本体は opacity と `0.97` から `1` までの scale で出入りする。backdrop は `background-color` の透明度を変えて、本体とは別に濃さを変える。reduced motion では scale を `1` に固定する。React Aria Components は `is-entering` と `is-exiting` の animation が終わるのを待ち、閉じるときは、終わるまで Dialog を取り除かない。閉じ始めたら中身を `inert` にして再送を防ぐ。
- **`Tooltip`**(`primitives/overlays/tooltip.tsx`):アイコンだけの操作に、操作の名前を添える。pointer を重ねて 400ms 後か、キーボードで focus したときに出し、離れたらすぐ隠す。面と縁は Popover と同じ `overlayPanel` で、文字は `caption`。読み上げの名前は、操作の `aria-label` が持つ(吹き出しは、見える利用者に名前を伝えるためのもの)。
- **`overlays/`**:画面に重ねる Dialog と Toast と、Select とナビの選択が開く選択肢の一覧と、Dialog を閉じたときの focus の戻り先を決める `FocusScope` を `primitives/overlays/` にまとめ、`primitives/` の直下を10件に収める。 Toast の部品と hook は、その中の `toast/` に置く。
- **`collections/`**:行を並べて扱う部品(並べ直せる一覧)を `primitives/collections/` に置く。
- **Toast**:操作の結果を `success` と `danger` で知らせ、tone ごとに形の違うアイコンを付ける。`success` の面は、地の上ではっきり見分けられるよう、`scheme-inverse` で画面の配色と逆にし(light では黒い面、dark では白い面)、アイコンに `success` の色を使う。`danger` の面は light でも dark でも `danger-strong` の赤にし、文・アイコン・閉じるボタンを `on-danger-strong` の白にする(どちらもユーザーが決めた)。面と地の色がはっきり分かれるので、半透明の縁の線は付けず、`shadow-overlay` だけを付ける。長い語も折り返し、アイコンと閉じるボタンの中心を文の1行目の中心にそろえる。
- **Toast の focus の ring**:Toast と region の focus の ring は面の外の地の上に描かれるので、地の配色の `focus` で描く。面の配色と塗りは内側の要素に当て、focus を受ける外側の要素は地の配色のままにする。面に `scheme-inverse` を当てると、ring の色も逆の配色で決まり、light の白い地の上で 3:1 に届かなかった。
- **Toast の表示時間と操作**:`success` は読める時間として5000ms表示する。region に hover や focus を始めると、React Aria Components がその時点で出ている Toast の timer を止める。`danger` は、失敗を読み終えられるよう、時間では消さず、閉じるまで残す。どちらも、訳した名前の閉じるボタンですぐに閉じられる。
- **Toast の読み上げと queue**:region の訳と landmark、F6 での移動、`alert` の読み上げ、閉じたときの focus の復帰は React Aria Components に任せる。`UiProvider` の下の `ToastProvider` が、描いた `ToastProvider` ごとに queue を持つ。Toast を出す側は、`useShowToast` が返す関数に、訳した文と `tone` を渡す。Provider ごとに queue を持つので、画面を描き直すテストや Storybook でも知らせを持ち越さない。`useShowToast` が返す関数は、出した Toast を閉じる関数を返す。ログアウトのように、送り直すときに前の失敗の Toast を閉じるため。操作の対象ごとに閉じる関数を分けて持ち(`useFailureToast`)、前の対象の失敗が遅れて届いても今の対象の Toast を閉じないようにする。分けた閉じる関数は、ほかの対象に移っても同じ hook の中に残す。写真を往復してから同じ写真の操作を送り直したときも、その写真の前の失敗を閉じられるため。対象を替えたときに描き直しを増やさないよう、state ではなく ref に持つ。
- **Toast の位置**:画面の上の中央に置く(ユーザーが決めた)。狭い画面のナビ(`data-top-bar`)、または幅によらず上端に帯を置く画面(`data-top-bar="always"`。今は写真のビューア)があるときに、帯が占める上端の高さを CSS で `--viewport-top-inset` として渡す。ナビは `h-nav-bar`、幅によらず置く帯は、折り返しを含む実際の高さを `--top-bar-height` で渡す。CSS は画面の名前を知らず、属性と変数の約束だけを持つ。Toast はこの値と上の safe area のうち大きいほうから 1rem 空け、ナビのボタンを覆わないようにする。左右は少なくとも 1rem 空け、幅は `max-w-sm`(24rem)までにする。新しい知らせを上に積む。操作の結果が同じ場所に出て、複数あっても順にたどれるようにする。 ビューアでは ResizeObserver で帯の高さを測り、ルート要素の CSS 変数に設定し、帯を外すときにその値を取り除く。固定を解除する低い画面では帯の高さを足さず、通知を画面内でスクロールできるようにする。
- **Toast の animation**:React Aria Components の Toast には `is-entering` と `is-exiting` が無いので、queue の `wrapUpdate` で View Transitions を始め、DOM の更新を `flushSync` で反映する。snapshot の準備中に queue が続けて変わったときは、1つの transition で反映する。続けて始めると先の transition が中断され、出入りの前後を撮れないため。opacity を変えながら、入るときは0.5rem上から下り、出るときは0.5rem上へ抜ける。入るときと残った Toast が詰まるときは200ms・`--ease-standard`、出るときは Dialog と共通の150ms・`--ease-exit` を使う。reduced motion では出入りの opacity だけを残す。Toast の transition 中は画面全体を snapshot から外して Dialog などの animation を止めず、snapshot は pointer 操作を受けないようにする。
- **遷移の帯**(`NavigationProgress`):画面の上端に、全幅で高さ 2px の帯を重ね、`primary` の色の、幅 40% の帯を左から右へ 1.2 秒で流す。動きは `translate` だけにし、main thread が止まっている間も(大きなフォームを描く間など)compositor で流れ続ける。出すときは次のフレームですぐ出し、消すときは 100ms 待ってから 150ms で薄くする。取得の合間に一瞬だけ待ちが切れても(固定ページを読んでから種類の定義を読み始めるまで、など)、ちらつかない。消えたら `display: none` にして、流れも止める(`transition-behavior: allow-discrete`)。読み上げは、出ている間だけ、訳した名前の `ProgressBar` を、見た目では隠して置く。reduced motion では流さず、全幅で止めて出す(明滅も、待つ間ずっと続くと気を散らす)。
- **画面が浮かび上がる動き**(`PageTransition`):opacity と 20px の上昇を、300ms の ease-out で動かす(ユーザーが決めた)。Dialog と同じ `--ease-standard` の 200ms では、出た瞬間にほぼ見えてしまい、不自然だった(ユーザーが見つけた)。終わった後に位置を残さない(`animation-fill-mode` を付けない。`translate` が残ると、中の要素の重ね順と `position: fixed` の基準が変わる)。
- **骨組み**(`Skeleton`):読み込む中身の形をなぞる。形は、文字の1行(`text`。20px の行に 12px の棒)・補足の1行(`caption`。18px の行に 10px の棒)・入力欄(`control`)・小さいボタン(`control-sm`)・画像の枠(`media`)の5つで、文字は行の高さを文字の役割と同じにし、中身に替わっても高さがずれない。棒は `surface-muted` で塗り、`fg` の 6% の光を左から右へ 1.6 秒で流す。動きは `translate` だけにし、main thread が止まっても流れ続ける。reduced motion では流さない。スクリーンリーダーには出さない。
- **読み込み中の欄**(`LoadingState`):`Skeleton` を並べ、一覧の行(`list`)とフォームの欄(`form`)の形を3つずつなぞる。骨組みは、言われる前から部品にし、画面ごとに棒を書き並べない(ユーザーが決めた)。新しい中身の形が要るときは、`Skeleton` を並べた形をここに足す。150ms 経ってから 200ms で浮かび上がらせ、速い読み込みではちらつかせない。読み込みの通知には共通の `LoadingStatus` を使う。先に空の `output` を置き、150ms 続いたら文言を入れる。強制配色では骨組みの塗りが背景に溶け込むため、文言を画面にも出す。 写真の一覧では画面と同じ縦横比の枠に `Skeleton` の `media` を置き、`LoadingState` の `custom` に渡す。画像の配置を保ったまま同じ待ち時間と読み上げを使える。
- **引き出したナビの animation**:開くときは 200ms、閉じるときは 150ms。面は `translate` で幅の分だけ左へ動かし、backdrop は Dialog と同じように濃さを変える。reduced motion では、面の位置を固定して opacity だけを変える。閉じ始めたら中身を `inert` にし、backdrop を押しても閉じないようにする。送信中は、送っていることを押したボタンで見せ続けるため、Escape・backdrop の押下・閉じるボタンで閉じられないようにする。
- **`FocusScope`**:`FocusScope` の中から開いた Dialog を閉じ終えたとき、Dialog を開いたボタンが消えていれば(行ごと削除したなど)、React Aria Components は外側の `FocusScope` の最初の要素に focus を移す。行と一緒に消えるボタンから Dialog を開く欄は `FocusScope` で包み、欄の最初の要素を戻す先にする。`react-aria-components` は `FocusScope` を export しないので、`react-aria` を依存に足す。バージョンは `react-aria-components` が依存するものにそろえる。ずれると `react-aria` が2つ入り、それぞれが別の `FocusScope` の木を持つので、Dialog が外側の `FocusScope` を見つけられない(パスキーの focus のテストで落ちる)。
- **並べ直せる一覧**(`ReorderableList`):React Aria Components の GridList と drag and drop で作る。マウスでは行をドラッグし、キーボードでは取っ手に focus して Enter で持ち上げ、矢印で動かし、Enter で置く。取っ手はマウスでは行の一部として振る舞う(React Aria Components が取っ手に `pointer-events: none` を当てる)ので、取っ手に hover の見た目を付けない。取っ手の名前・操作の案内・置いた結果の読み上げは React Aria Components に任せる。行の中の操作は Tab でたどり(`keyboardNavigationBehavior="tab"`)、行は矢印で移る。行は `surface` の面に半透明の縁と `shadow-control` を付け、行の間を 0.5rem 空ける。置く位置は、行の間に `primary` の線で示す。線の要素は高さを持たず、上下の負の margin で、線の要素が増やす gap の分を打ち消すので、ドラッグの間も行が動かない。動かしている行は、`surface-sunken` の面と点線の縁にする。並びが変わらない置き方では、呼び出し元に知らせない。送っている間などは `isDisabled` で並べ直しを止める(取っ手は押せなくなり、行の中の操作は使える)。止めるのは、ドラッグを終えてからにする。マウスでは、置いた後に dragend が届いてドラッグが終わるので、置いてすぐ(送り始めたとき)に止めると、React Aria Components がドラッグの終わりを受け取れず、置いた行が動かしている見た目のまま残った(Playwright で確かめた)。
- **中身の無い欄**(`EmptyState`):一覧などが空のとき、アイコン・見出し・補足・操作を、点線の枠の真ん中に並べる。点線で、中身が置かれる場所を示す。アイコンは `surface-muted` の丸(36px)の中に、20px(`lg`)で描く。
- **読み込めなかった欄**(`ErrorState`):読み込めなかったことを見出しで、次にすることを補足で伝え、「もう一度試す」のボタンを置く。並びと大きさは中身の無い欄と同じにし、点線でなく実線の枠と、`danger` の薄い丸(`danger/10`)の雲のアイコンで、空とは見分ける。一覧の中(`inline`)では枠を付け、画面の中身の全体(`screen`)では枠を付けない(区切る相手が無い)。見出しのレベルは、置く場所の見出しの次のレベルを呼び出し側が渡す。何を読み込めなかったか(見出し)は feature が渡す。最初の補足は、画面に合わせた文(種類の定義を読めないときなど)を feature が渡せ、渡さなければ部品の文(接続を確かめてから試し直すこと)を出す。取り直しも失敗した後の2文と、ボタンの文言は部品が持ち、どの画面でも同じにする。
- **読み込めなかった欄の取り直し**:見出しと補足を `alert` にまとめ、出たときに読み上げる。取り直している間は、ボタンを送信中にし、focus を残す。取り直しも失敗したら、補足を「まだ読み込めません。」と次にすることの2文に替え、`alert` の要素を作り直して読み上げ直す。3回目からは文が同じなので、作り直さないと読み上げられない。失敗したかは、描いている間に「取り直しているか」が true から false に変わった回数で数える(取れたら、呼び出し側がこの欄を描かない)。画面が隠れて、次の試行を待って一時停止している間も、取り直していることにする(一時停止を失敗と数えない)。2文は別の行にし、補足の行の長さを `text-balance` でそろえる。1つの文にすると、狭い画面で「時間をおいて」の途中で折り返した。取り直せた後は、一覧やフォームの全体に focus を移さない。次に操作するものを示す枠が、欄の全体を囲んでしまうため。
- **アイコンの大きさ**(`Icon` の `size`):12・14・16・20・24px の5段(`xs`〜`xl`。既定は16px の `md`)。lucide の線の太さは viewBox(24)に対する値なので、小さく描くほど線が細くなる。大きさごとに viewBox の中の太さを決め(`xs`・`sm` は 2、`md` は 1.75、`lg`・`xl` は 1.5)、既定の太さ(`weight="regular"`)では、描いた線を 1〜1.5px に収める。階層の見出しには、28px の丸の中に 16px のアイコンを置く。階層の 2px の線と並べるアイコンは `weight="bold"` にし、どの大きさでも線幅を 1.5px にする(ユーザーが決めた)。16px のアイコンでは既定の約 1.17px は細く、2px は太く見えたため(ユーザーが見つけた)。36px の丸の中に16px で曲線の多いアイコンを描くと、線が 1.2px ほどになり、曲線と短い直線とで太さが違って見えた(ユーザーが見つけた)。
- **バッジ**(`Badge`):状態を短く示す。用途(`tone`)ごとの色の組は、`Notice` と同じく `/10` の面と、同じ色の線と文字。見せ方(`variant`)は、線と薄い面の `outline`(既定)と、薄い面と文字だけの `soft` の2つ(ユーザーが決めた)。`soft` の線は透明にして残し、forced-colors で面が消えても形を残す(塗りのボタンと同じ)。どちらも高さは 20px で、並べても揃う。`neutral` の `soft` は、`fg` の 10% の面に `fg` の文字にする。`fg-muted` の文字では、薄い面の上で 4.5:1 に届かない。
- **ナビと本文**:広い画面では、`surface-sunken` の地にナビを置き、隣の `surface` の本文を角丸・影・半透明の縁で浮かせる。本文は document と一緒に scroll し、ナビは sticky で残して中だけ scroll できるようにする。狭い画面では sticky の帯の下に全幅の本文を置き、ナビは左の全高の drawer に収める。閉じるボタンは、帯の開くボタンと同じ位置に置く。狭い画面では、focus した要素と ring が帯に隠れないよう、document の scroll-padding-top に帯の高さと ring の幅・offset を足した分を取る。
- **ナビの左端**:広い画面では、アプリのロゴ・まとまりの見出し・リンクのアイコンを左から24px にそろえ、アプリ名とリンクの文言を48px にそろえる。狭い画面では、本文の左端と開くボタンのアイコンを24px にそろえる。
- **今いる場所**:`aria-current="page"` を付け、ナビの地に `surface` の行を影と半透明の縁で浮かせ、文字を `label` にする。縁は `::after` に描き、行の focus ring と両方見えるようにする。forced-colors でも縁を残す。hover では、縁を `fg` の 20% に濃くする。面だけが明るくなると、dark で縁が面より暗く見え、不自然だった(ユーザーが見つけた)。
- 選んだ状態とほかの overlay(Popover・Menu など)の決まりは、その部品を足すときに入れる(選んだ状態は hover より強くし、形でも示す)。overlay には `shadow-overlay` を付け、地と近い色の面には半透明の縁の線を重ねる。

## 検査

どの決まりも、文書だけでは守られないので、lint とテストで止める(リポジトリの `DECISIONS.md` の「境界はツールで強制する」)。lint の設定は `tooling/lint/config/admin-classes.ts`、仕組みは `tooling/DECISIONS.md` にある。

### 画面のコード(`ui/` の外)

- 書いてよい class は、子の大きさと見せ方の5つ(`grow`・`shrink-0`・`min-w-0`・`truncate`・`sr-only`)だけ。並べ方(`flex`・`grid`・gap・padding)・文字(`text-*`・`font-*`)・色は、部品と props で決める(`<Stack gap={2}>`・`<Text variant="caption">`・`<Badge tone="danger">` など)。許す側の一覧にするので、新しい class を使いたくなったら、部品を足すか、一覧を足すかを決めることになる。
- `className` には文字列のリテラルだけを渡す。変数や式を渡すと、class の検査が中身を読めない。
- `style` は書かない。
- 受け取った props を、JSX にそのまま spread しない(`{...props}`・`{...rest}`)。spread で渡した `className` や `style` は、検査が見ない(部品でも同じ)。spread できるのは、その場か同じファイルの `const` に書いて書き換えない、`className`・`style`・`…ClassName` を含まないオブジェクトと、見た目の props を返さないと確かめた React Aria の hook の値だけ(`tooling/DECISIONS.md`)。

### 部品(`ui/`・`features/*/ui/`・`components/*/ui/`)

- `app.css` を入口にした Tailwind CSS の設定で生成できない class(Tailwind CSS の既定の色や目盛りなど)。`app.css` は `theme.css` と `animation.css` を読む。
- `[…]` の付く class(任意の値・任意のプロパティ・任意の variant)。値は theme.css の役割か、部品の props で決める。`[&>svg]:size-icon` のような子を選ぶ variant も止める。子の大きさは、子の部品の props で決める。
- `(--name)` で CSS 変数を直接読むこと。読めるのは、実行時に決まる値を渡す変数(React Aria Components の `--trigger-width`・`--visual-viewport-height`、`--progress`・`--media-aspect`・`--media-color`・`--focal-x`・`--focal-y`、スクロール領域の上限 `--scroll-view-limit` とつまみの寸法・位置 `--scroll-thumb-size`・`--scroll-thumb-position`)だけ。型の付いた読み方(`stroke-(length:--progress)`)も許す。部品が `style` で渡せるのは、`css-variables.ts` で React の型に足した変数だけ。
- `dark:`(light と dark は `light-dark()` で決める。`not-dark:` のような組み合わせた variant の中も)、`!`(variant の後ろも)、生の `data-*:`・`aria-*:`(状態は `is-*:` の variant を使う。生の variant は名前の順に並び、`data-disabled:` が一番弱くなる。打ち間違いも CSS を出すので、無い class でも止まらない。`group-not-aria-*:` のような組み合わせの中も)、数値の `z-*`(`z-10` など)、型を付けた CSS 変数の文字の大きさ(`text-(length:--x)`。色の `text-(color:--x)` は除く)、数値の `font-*`(`font-500` など)、`outline-none`(`outline-hidden` を使う。forced-colors で線が残る)。
- 余白(gap・padding・margin・scroll の padding と margin)の値は 0・0.5・1・1.5・2・3・4・6・8・12(margin は `auto` も)。パネルの見出し・本文・操作とスクロール領域の両端をそろえるときは、padding・margin・scroll-padding の x・y に共通の `panel` を使える。正の上と下の margin(`mt-*`・`mb-*`・`my-*` と、上下にも付く `m-*`)と `space-x/y` は使わず、親の gap で空ける。`0` と `auto` は空きを作らないので許す。子の側で空けると、並べ替えや出し分けのたびに空きが崩れる。縦のスクロールバーを内容と同じ位置から始め、同じ位置で終える `my-panel` は例外。負の margin は、はみ出させるために許す。
- `leading-*` と、行間を付けない `text-*`(文字の大きさ)。文字の大きさと太さ(`text-sm/xl`・`font-semibold` など)は、`ui/typography.ts` の文字の役割の対応にだけ書く。対応の中で使える組は、役割で使う7つ(`xs/lg`・`sm/xl`・`sm/2xl`・`base/2xl`・`lg/2xl`・`xl/3xl`・`3xl/5xl`)だけ。`text-sm/5` のような数の行間は、`--spacing` の倍数として通ってしまうので止める。
- `--*: initial` の後も Tailwind CSS が作る class(`duration-150`・`delay-*`・`ease-linear`・`ring-2`・`opacity-50`・`bg-linear-*`・`from-*` など)。`opacity-0` と `opacity-100` は、出入りの動きに使うので許す。
- 色の不透明度の修飾は 5・10・15・20・30・40・60・80 だけ(theme.css の色のほか、`current`・`transparent`・CSS 変数の色にも)。面の色(`canvas`・`surface`・`surface-sunken`・`surface-muted`)には付けない。面は不透明にすると決めているため。
- 色の見本(`specimens/color-specimen.tsx`)だけは、色ごとに使ってよい utility の決まりと、`line-strong` を `primitives/` の外で止める決まりを外す。どの色も `bg-` で塗って並べるため。見本の正方形の縁は、外周の border でなく、塗りの上に重ねる半透明の線(内側に1px の `outline`、`fg` の 10%)で描く。不透明な `line` の border だと、塗りの外に枠が足されて見えた(ユーザーが決めた)。見本が theme.css の色をすべて並べることを、テスト(`specimens/__tests__/color-specimen.test.tsx`)で確かめる。
- 色ごとに、使ってよい utility を決める。`canvas`・`surface`・`surface-sunken`・`surface-muted`・`scrim`・`danger-strong` は `bg-` だけ、`line` は `border-`・`divide-`・`outline-` だけ、`line-strong` は `border-` だけ、`danger` は invalid の focus の ring のために `outline-` も、`fg` は面の縁の半透明の線のために `outline-` も、`focus` は `focus-ring` の中だけ、など(一覧は `admin-classes.ts` の `COLOR_USAGE`)。色を取る utility を列挙すると漏れる(`ring-offset-*`・`text-shadow-*` など)ので、末尾が色の名前の class をすべて見て、決めた utility の外を止める。角丸の `rounded-surface` と、空白の扱いの `whitespace-pre-line` は、色でないので除く。色を足したら、ここにも決まりを足す(テストで止まる)。
- `className` には、文字列のリテラルか、`tv` などで作った関数の呼び出しを渡す。React Aria Components の render props で値を持つ属性を渡すときは、呼び出しを返す関数(`({ placement }) => popover({ placement })`)にする。変数や条件の式を渡すと、class の検査が中身を読めない。
- 1つの文字列に書ける class は8個まで(ユーザーが決めた。`project/max-classes-per-string` で止まる)。長い文字列は、どこからどこまでが並べ方で、どこからが状態かを読み分けにくい。`tv` の設定(`base`・`slots`・`variants`・`compoundVariants`)と、`tv` の関数に渡す `className` の文字列は、配列にし、意味のまとまり(並べ方・箱・色・状態など)ごとの文字列に分ける。整形が、配列の要素を1行ずつに折り返す。JSX の `className` の文字列は、React が配列を受けないので、`tv` に移す。入れている tailwind-variants(4.0)は、`base` や `className` に配列を受け、つないでから merge する。分ける前と後で、全部の story を描いた要素の class の組が変わらないことを確かめた。
- `style` には、その場で書いたオブジェクトだけを渡し、キーは `--` で始まる CSS 変数だけにする。見た目は class で書き、`style` は実行時に決まる値を CSS 変数として渡すためだけに使う。画像の縦横比は `width`・`height` の属性で付ける。

### ファイル

- CSS のファイルは `src/ui/` にだけ置き、パレットの変数(`--palette-*`)を読めるのは `theme.css` だけ(`apps/admin/__tests__/theme.test.ts`)。
- `--color-*` と `--text-*` の名前は重ねない。重ねると、`text-<名前>` が色か大きさかを Tailwind CSS が取り違える。文字の大きさと行間は、同じ名前の目盛りにする(同じテスト)。

## 割り切ったこと

- **Modal の中の Tooltip に pointer を移すと閉じる**。React Aria Components は、Modal を開いている間、その外に描いた要素を `inert` にする。Tooltip は Modal の外に描かれるので、ボタンから吹き出しへ pointer を移しても hover を受け取れず、300ms 後に閉じる(Modal の外では、吹き出しの上でも開いたまま)。吹き出しはボタンの 6px 上に出る1〜2語で、ボタンに pointer を置いている間は読める。読み上げの名前は `aria-label` が持つ。直すには、吹き出しを描く先を Modal の中へ移す仕組みが要るので、受け入れる。
- **後から出す `status` の知らせ**:`Notice` の `status`(発行したトークンを一度だけ表示するときの注意など)は、中身と一緒に描くので、スクリーンリーダーによっては読まれない(live region は、中身を変える前からあるものが確実に読まれる)。`Notice` はその場に残す知らせで、スクリーンリーダーへの割り込みは要らないので受け入れる。急ぎの誤りは `alert` で読まれる。
- **層の検査が見ない import**:層の境界の lint は、import 文の名前だけを見る。`import("react-aria-components").LinkProps` のような型の中の import と、ほかの層を通した再 export は見ない。どちらも今のコードに無く、追うには依存の木を解く検査が要る。
- **検査が見ない class の渡し方**:JSX の属性と、`tv`・`merge` などの呼び出しの中の文字列だけを検査する。DOM を直に触る `element.classList.add()` や `element.style`、`className` に渡した、`tv` で作っていない関数の戻り値は見ない。写真の帯の高さは計測結果を渡すため、ルート要素の `style` に CSS 変数を設定する。参照先まで追う検査は、作る手間に見合わない。
- **入力を受ける部品の枠の濃さ**:入力を受ける部品の枠(`line-strong`)は、地とのコントラストが、部品の枠に要る 3:1 に届かない(light の白の上で約 2.6:1、dark の `surface` の上で約 2.3:1)。3:1 に届く濃さ(パレットに無い灰色や、`fg-muted` の濃さ)より、この濃さをユーザーが選んだ。入力欄は面(`surface`)と影とラベルでも見分けられ、管理者1人が使う画面なので受け入れる。
- **部品と見本の配色の取り違え**:コントラストのテストは theme.css の色の組を確かめ、部品がどの組を使うかは確かめない。`Button` の `danger` を `bg-danger text-on-danger` に戻しても、テストは通る(どちらの組も lint で許す)。色の見本のテストも、theme.css の色の名前が light と dark の欄にそろっていることだけを確かめ、塗りの色が名前と合っているかは確かめない。happy-dom は CSS を読まないので、描いた色を確かめるにはブラウザでのテストが要り、class の名前で確かめるとマークアップをなぞるテストになる。部品と見本の見た目は Storybook で見る。
- **sRGB に入らない色のコントラスト**:コントラストのテストは、sRGB に入らない色(red-700 など)を 0〜1 に clamp して計算する。CSS Color 4 の gamut mapping(彩度を落として収める)で計算すると、4.5:1 の境目の色では、コントラスト比が 0.2 ほど変わることがある(今の塗りは、どれも境目から離れている。`danger-strong` の白い文字は、hover でも 6.0:1)。gamut mapping をテストに入れる手間に見合わないので、境目に近い色を足すときは、両方の計算で確かめる(Codex のレビューで見つかった)。
- **等幅の要素の子の行頭の括弧**:日本語の中の `code` などの子要素(`<code><span>「…」</span></code>`)では、`:lang(ja)` の `trim-start` が子に当たり、行頭の括弧が詰まる。今の画面に等幅の中で括弧から始まる文は無く、詰めない指定を子にまで広げると、字体の切り替えの決まりも組み直しになる(Cursor のレビューで見つかった)。
- **閉じ始めた Dialog に遅れて届く click**:タッチで Dialog の確認のボタンを長押しして離すと、ブラウザが click を出さないので、React Aria Components が 80ms 後に `click()` を呼ぶ。その 80ms のうちに Escape か backdrop で閉じると、閉じる animation の間に残ったボタンに `click()` が届き、中身を `inert` にしていても、押した操作が送られる。マウス・キーボード・普通のタップでは起きず、送られるのは確認のボタンで押した操作そのもの(削除なら、再認証の OS の画面で止められる)。起きる条件が狭いので受け入れる(ユーザーが決めた)。
- **hover の間に足した Toast の timer**:region に hover や focus を始めると、React Aria Components はその時点で出ている Toast の timer を止めるが、その後に足した Toast の timer は止めない。Toast に pointer を置いたまま、ほかの操作の成功が届くと、後から出た `success` の Toast は5秒で消える。起きるのは、Dialog で送った操作の応答を待つ間に、画面の上の Toast へ pointer を動かしたときだけで、消えるまでの5秒は読め、操作の結果は一覧の変化でも分かる。止めるには React Aria Components の timer の作りに逆らう作りが要るので、受け入れる。
- **ログアウトした後に残る Toast**:Toast の queue は、ログインの前と後で共通の `UiProvider` の下にある。`success` の Toast が出ている5秒の間に、すべてのセッションからログアウトすると、ログインの画面にもその Toast が残る。残るのは5秒以内で、中身は利用者自身の操作の結果。閉じるまで残る `danger` の Toast(固定ページの保存・公開の切り替え・並べ直しの失敗、ログアウトの失敗。固定ページの保存とナビのログアウトは、同じ操作を送り直すときにその失敗の Toast を閉じる)は、閉じずにログアウトすると、ログインの画面にも閉じるまで残る。失敗の直後に閉じずにログアウトしたときだけで、閉じるボタンで消せる。セッション切れの失敗では Toast を出さない(`useApiMutation` の `onError` を呼ばない)ので、セッションが切れてログインの画面に移るときには残らない。ログインした後の画面だけで queue を持つには、Toast の Provider の置き場所を route の組み立てと一緒に変える必要があり、手間に見合わないので受け入れる。
- **閉じる animation の間の Tab**:Dialog を閉じ始めると、中身を `inert` にして focus が外れ、React Aria Components は背後の画面の `inert` と focus の閉じ込めを外す。開いたボタンに focus を戻すのは、閉じる animation が終わって Dialog を取り除いたとき。その間(150ms)に Tab を押すと、focus は開いたボタンの次でなく文書の先頭の側へ移り、開いたボタンには戻らない(Chrome と WebKit で確かめた)。閉じる animation の間も focus を Dialog に残すには React Aria Components の振る舞いに逆らう作りが要り、150ms のうちに Tab を押すことは少ないので受け入れる(ユーザーが決めた)。
- **引き出したナビの閉じる animation の間**:上の、Dialog についての2件(遅れて届く click と、閉じる animation の間の Tab)と同じ作りなので、引き出したナビでも同じことが起きる。タッチでリンクかログアウトのボタンを長押しして離し、80ms のうちに Escape か backdrop で閉じると、そのリンクの行き先へ移るか、ログアウトする(ログインし直せば戻れる)。閉じる animation の間(150ms)に Tab を押すと、閉じ終えても開くボタンに focus が戻らない。Dialog と同じ理由で受け入れる。
- **数値として成立しない入力の送信**:数値の入力欄で、保存済みの値を `-` のような未完成の入力に置き換えて送ると、入力欄は直前に確定した値に戻り、その値が送られる(React Aria Components の仕様。Chrome と WebKit で確かめた)。送られる値は、戻った入力欄に見える値と同じで、画面と保存した値はずれない。必須の欄を空にした場合は、必須の誤りになり、送られない。直すには、入力中の文字列を自分で持って検査する必要があり、ライブラリに任せる作りに逆らうので、受け入れる。
- **桁区切りを含む数の貼り付け**:数値の入力欄は桁区切りを入れないので、React Aria Components は桁区切りを含む値を数として読まない。欄の値を全部選んで `1,234.5` のような値を貼り付けると、入力欄は直前に確定した値に戻り、知らせは出ない(React Aria Components の仕様。Chrome で確かめた)。戻った値は入力欄に見え、送られるのもその値なので、画面と保存した値はずれない。桁区切りの無い値を貼り付け直せば入る。表示に桁区切りを入れずに、貼り付けた桁区切りだけを読むには、React Aria Components の貼り付けの処理に逆らって値を読み直す作りが要るので、受け入れる。
- **長いテキストの改行コード**:`CRLF` や `CR` を含む保存済みの本文を `TextArea` の `defaultValue` に渡すと、ブラウザの textarea が改行を `LF` にそろえるので、編集せずに送っても `LF` の本文が送られる(Chrome と WebKit で確かめた)。管理画面で入力した本文は `LF` だけなので、`CRLF` や `CR` が入るのは API で直に保存した本文に限り、文字は変わらず、改行の表し方だけが変わる。元の文字列を持って比べる作りは、textarea の仕様に逆らうので、受け入れる。
- **Windows の和文の太さ**:Windows の和文の字体には 600 が無いものがあり、600 と 700 の区別がつかないことがある(実機では確かめていない)。管理画面は管理者1人が Mac で使うので、受け入れる(ユーザーが決めた)。公開サイトは、作るときに決める。
