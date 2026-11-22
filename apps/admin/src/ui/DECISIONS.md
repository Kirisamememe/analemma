# 決めたことと理由(デザインシステム)

管理画面と公開サイト(Amayadori)で、同じデザインシステムを使う(ユーザーが決めた)。色や文字などの役割は `theme.css`、animation の class と keyframes は `animation.css` に置く。アプリごとに変えるのは1層目のパレットだけで、2層目から下(役割の名前・文字の目盛り・状態・規則)はそろえる。公開サイトへの配り方は、まだ決めていない(リポジトリの `AGENTS.md` の「まだ決めていないこと」)。

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

不透明な色を22個だけ持つ。

| 種類                       | 名前                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 面                         | `canvas`(画面の地)・`surface`(カード・ダイアログ・入力欄)・`surface-sunken`(サイドバー・表の見出し)                |
| 文字と線                   | `fg`・`fg-muted`(補足と placeholder)・`line`(線の既定)・`line-strong`(入力を受ける部品の枠)・`focus`               |
| 塗り                       | `primary`・`on-primary`・`danger-strong`・`on-danger-strong`(取り消せない操作のボタンと失敗の Toast)               |
| 意味                       | `info`・`success`・`warning`・`danger` と、その塗りの上の文字の `on-info`・`on-success`・`on-warning`・`on-danger` |
| light と dark で変わらない | `scrim`(写真や画面の上に重ねて暗くする色)・`on-media`(写真の上の文字)                                              |

- 透明度付きの色の変数は作らない。薄い色は、部品の中で Tailwind の不透明度の修飾(`bg-danger/10` など)で作る。透明度付きの変数を足していくと、同じような色の変数が増える。
- 面の色は不透明にする。`surface-sunken` は sticky の見出しにも使うので、下が透けない。
- 意味の色の塗りの上の文字は、色ごとの `on-*`(`on-info` など)にする。今の値はどれも `canvas` と同じ(light では白、dark では黒)。dark の意味の色は明るく、白い文字では読めないため。色ごとに名前を分けておき、塗りによって文字の色を変えたくなったときに、部品を書き換えずに済むようにする(ユーザーが決めた)。
- 取り消せない操作(削除・すべてのセッションからのログアウトなど)のボタンと失敗の Toast(どちらも `danger` の tone)は、`danger` と別の塗り `danger-strong`(light でも dark でも red-700)に、白い文字 `on-danger-strong` を載せる。dark では、暗い面の上の赤い文字が 4.5:1 に届くには明るい赤(red-400)が要り、塗りの上の白い文字が 4.5:1 に届くには濃い赤が要るので、1つの赤では両立できない。red-400 の塗りに黒い文字では色が薄く見えたので、濃い赤の塗りに白い文字にした(ユーザーが決めた)。dark でも red-700 にし、hover で文字の色を重ねても 4.5:1 を割らないようにする。`danger` は、文字・枠・薄い面(`Notice`・`Badge`・入力欄の誤り)の色として残す。名前は `primary` と `on-primary` に合わせる(`on-X` は、`X` の塗りの上に載せる文字の色)。
- `black`・`white` という名前は使わず、用途の名前(`scrim`・`on-media`)にする。`bg-white` をカードに、`text-white` を塗りの上に、と書かれやすく、dark の意味の色の塗りの上の白い文字は、コントラストが 1.7〜2.9:1 しかない。
- パレットの無彩色は、Tailwind CSS の neutral と同じ値にする。管理画面の `primary` は白と黒。役割の名前は、自分たちの名前(`canvas`・`surface`・`fg` など)を使う。
- light の意味の色は、薄い面の上の文字でも 4.5:1(WCAG の AA)に届く段にする(red-700・green-800・amber-800・blue-700)。
- コントラストは、theme.css を読むテスト(`apps/admin/__tests__/theme-contrast.test.ts`)で確かめる。塗りと、その上の文字の組(`on-*`)は、hover の重ねも含めて 4.5:1 に届く。意味の色は、面(`canvas`・`surface`・`surface-sunken`)と、その上の `/10` の薄い面の上の文字として、light でも dark でも 4.5:1 に届く。OKLCH を sRGB に直し、sRGB に入らない色は 0〜1 に clamp して計算する。計算は役割の色の定義を読むので、同じテストで、役割の色をほかの場所で上書きしないこと(forced-colors のシステムの色を除く)、`on-*` が、`on-` を除いた名前の塗りと組になること(写真の上の `on-media` を除く)、hover の重ねが文字の色を透明と混ぜたものであることも確かめる。上書きは forced-colors の中だけに許し、そこでは塗りを `Highlight` に、その上の文字を `HighlightText` に差し替えること、パレットの色も1か所だけで定義すること、hover の utility が1か所だけであることも確かめる(CSS のコメントは除いて読む)。どれかが崩れると、計算した色と実際の色が食い違う(Codex と Cursor のレビューで見つかった)。
- dark の `surface-sunken` は、`surface` と別の段(neutral-950)にする。同じ色だと、dark のサイドバーで、今いる場所が見分けられない。
- light の `focus` は neutral-500 にする。白に対して 3:1 に届く。
- 線の色は2つ。区切りの線やカードの枠は `line`(light で neutral-300、dark で neutral-700)、入力を受ける部品(入力欄・Checkbox・Radio・Switch・Select など)の枠は `line-strong`(light で neutral-400、dark で neutral-600)で描く。どちらの値も、ユーザーが決めた。文字の色の `fg-muted` を枠に流用しない(役割を混ぜない。ユーザーが決めた)。
- `line-strong` は、入力を受ける部品の専用にする(ユーザーが決めた)。入力を受ける部品は React Aria Components を包むので、どれも `primitives/` にある。`line-strong` の class を書けるのは `primitives/` だけで、patterns・layout・`features/*/ui/` では書けない(lint で止まる)。

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
- reduced motion では、base で transition を一律に止める。animation は見せ方が部品ごとに違うので、部品が使う class で決める。spinner は `motion-reduce:` で `animate-pulse` に替える。`animation.css` で Dialog の scale を `1` に固定し、引き出したナビは opacity だけを変える。
- forced-colors では、役割の変数をシステムの色(`Highlight` など)に差し替える。塗りの `danger-strong` と `on-danger-strong` は、`primary` と `on-primary` と同じく `Highlight` と `HighlightText` にする。

## 部品の層

| 置く所                | 中身                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `tv.ts`               | デザインシステムの class の組を設定した `tv` と `merge`                                               |
| `typography.ts`       | 文字の役割と、目盛りの組と太さの対応(組を書けるのはここだけ)                                          |
| `primitives/`         | ボタン・リンク・入力欄・`Notice` など、いちばん小さな部品。React Aria Components を使えるのはここだけ |
| `layout/`             | 並べ方(`Stack`・`Cluster`・`Center`・`AppShell`)と文字(`Text`・`Heading`)                             |
| `patterns/`           | primitives と layout を組み合わせた、画面に共通の形(`PageHeader` など)                                |
| `features/<名前>/ui/` | 1つの画面だけの部品(`ui/` と同じ決まり)                                                               |
| `specimens/`          | 色と文字の見本と、story の展示用の枠(`story-stage.tsx`)。Storybook で見る                             |

- import の向きは、patterns → primitives・layout。layout は primitives と patterns を、primitives は patterns を import しない(lint で止まる)。layout は並べ方と文字だけを持つ層で、操作を持たない。
- React Aria Components(`react-aria`・`react-stately`・`@react-aria/*`・`@react-stately/*`・`@internationalized/*` と、型だけの import も)を import できるのは `primitives/` だけ。primitives は、React Aria Components の props の型を extends せず、自分の props の型を持つ。画面のコードに、ライブラリの props(`className` の関数や、`data-*` の render props など)を見せない。ライブラリを替えるときに直すのは primitives だけになる。
- UI の外部ライブラリは、`ui/` の部品で包む。lucide-react を import できるのは `primitives/` だけで、ほかの層は `Icon` に名前を渡す(ユーザーが決めた)。
- `tailwind-variants` は `tv.ts` だけが import し、ほかは `tv.ts` の `tv` と `merge` を使う(lint で止まる)。既定の入口の `tv` は theme.css の名前を知らず、`z-sticky z-overlay` のような theme.css の名前の組を merge できずに両方残す(後から渡した class で上書きできない)。
- merge の設定には、`theme.css` と `animation.css` の名前を入れる。名前ごとに「同じ組の2つを渡すと後だけが残る」ことと、`@utility` ごとに組の相手を決めてあることを、CSS を読むテスト(`apps/admin/__tests__/tailwind-merge.test.ts`)で確かめる。名前が1つしかない組(`grid-cols-thumbnails`・`aspect-photo`)は、Tailwind CSS の既定の class を相手にする。`tv` の variant を通しても merge が効くことを確かめる。`state-pressed` は `translate` の組に入れ、`state-hover` と一緒に渡しても両方残す。`state-disabled` は透明度と押せるかどうかを変えるだけなので、hover や pressed とは組にしない(組にすると、`state-hover state-disabled` で hover の見た目が消える)。
- 文字の役割と組:`body`(`text-sm/xl`・400)・`body-long`(`text-sm/2xl`・400。長い文)・`caption`(`text-xs/lg`・400)・`label`(`text-sm/xl`・600)・`section`(`text-base/2xl`・600)・`page`(`text-xl/3xl`・700)・`display`(`text-3xl/5xl`・700)。`Text` と `Heading` は、文字の役割を `variant` で受ける(`role` にすると、ARIA の `role` と取り違える)。`Heading` は見出しのレベル(h1〜h3)から役割の既定を決め(レベル 1 は `page`、2 と 3 は `section`)、見た目とレベルを別々に選べる。
- `UiProvider`(`primitives/ui-provider.tsx`)が、React Aria Components に、i18next の今の言語(`I18nProvider`)と、TanStack Router の navigate(`RouterProvider`)を渡す。リンクは TanStack Router の型の付いた行き先だけを受け、画面を読み込み直さずに移る。

### 部品の決まり

- **塗りのボタン**:`border border-transparent` を付ける。forced-colors で、塗りが消えても線として残る。
- **押せない・送信中**:見た目(`state-disabled` など)だけでなく、React Aria Components の props(`isDisabled`・`isPending`)で動きを止める。CSS の `pointer-events` はキーボードの操作を止めない。送信中のボタンは、focus を残したまま押せなくし、spinner を、訳した名前の付いた `ProgressBar` の中に出して、待っていることをスクリーンリーダーに伝える(spinner だけでは、スクリーンリーダーはボタンの名前しか読まない)。spinner は `block` にし、`ProgressBar` の箱を spinner の大きさにして、ボタンの `items-center` で文字の中心にそろえる(`inline-block` では、行の高さの箱の中で baseline に載り、文字より 2〜3px 上にずれる)。React Aria Components は送信中のボタンを `type="button"` に変えるので、入力欄の Enter がフォームを送り直せる。`Form` にも `isPending` を渡し、送信中は送らない(管理画面の「送信中はボタンを無効にする」)。
- **長い語の折り返し**:`Text`・`Heading`・Dialog の見出しは `wrap-anywhere`(`overflow-wrap: anywhere`)にする。パスキーの名前のような利用者が付けた文字列は、空白の無い長い英数字でもよいので、語の途中でも折り返し、狭い画面や拡大で横にはみ出さないようにする(flex の中でも、min-content の幅が縮む)。happy-dom は配置を計算しないので、テストでは確かめない(Copilot のレビューで見つかった)。
- **リンク**:いつも下線を付ける。`primary` が中立色なので、色だけではリンクと分からない。
- **入力欄**:ラベル・補足・誤りの知らせを、React Aria Components の slot で入力欄に結びつけ、補足と誤りを入力欄の説明として読み上げさせる。誤り(invalid)のときは、枠も focus の ring も `danger` にする(forced-colors では、ring をシステムの `Highlight` のままにする。`danger` で上書きすると、focus の前後で見分けられなくなる)。ring だけ `focus` の灰色のままだと、赤い枠の外に灰色の輪が重なって見えた(Storybook でユーザーが見つけた)。server が断った入力は、`Form` の `validationErrors` で入力欄ごとに出す。入力欄(`TextField`・`TextArea`・`NumberField`)は `primitives/form-fields/` にまとめ、ラベル・補足・誤りの知らせと、枠の見た目を共有する。
- **長いテキストの入力欄(`TextArea`)**:初めから4行分の高さを取り、縦に resize できるようにする。入力欄の幅をそろえたまま、利用者が長い文を見渡せるようにする。
- **数値の入力欄(`NumberField`)**:表示は React Aria Components が言語に合わせて整え、`FormData` には桁区切りの無い値を入れる。数値の項目の値には小数の桁数に上限が無いため、入力欄を出るときに Intl の既定で小数が丸まらないよう、有効数字を17桁まで使う。増減はボタンと上下の矢印キーで行い、フォームを scroll するときに値が変わらないよう、ホイールでの増減は切る。入力欄と増減ボタンを1つの枠に収め、どこに focus があっても枠全体で示す。増減ボタンの名前には管理画面の訳を使い、どの入力欄の値を増やすか、減らすかを自然な語順で伝える。
- **`Notice`**:誤り(`danger`)は `alert` にしてすぐに読み上げ、ほかは割り込まない `status` にする。`Notice` は、その場に残す知らせ(送信の誤りや、読み込めなかったことなど)に使い、保存したなどの操作の結果は Toast で知らせる。
- **見出しの操作と補足**:`PageHeader` は、`false`・`null` の操作と、空の補足を、無いものとして扱う(条件で出さない操作のために、空の要素が余白を取らないように)。操作のボタンの中心は、見出しの1行目の中心にそろえる。上にそろえると、ボタン(`h-control` の 36px)が見出しの行(`page` の 28px)より高いぶん、4px 下にずれた(Storybook で見つけた)。見出しの上を `pt-1`(差の半分)空け、見出しの位置は、操作の有無で変えない。操作を負の margin で上げると、狭い画面で操作が次の行に折り返したときに、見出しとの間が詰まる(Codex のレビューで見つかった)。
- **縁の線**:border を使うのは、背景の色とコンテンツの色をはっきり見分けられるときだけにする(`Badge`・`Notice` のように、意味の色の `/10` の面に同じ色の線を引くときなど)。背景と近い色の面(白い Dialog が明るい地の上にあるときなど)の縁は、半透明の線(`outline`、`fg` の 10%)で描く。面の縁の線は、offset を付けず、塗りの外側の地の上に重ねる(地の色が透けて、縁がくっきり出る)。色の見本の正方形のように、塗りそのものの縁を見せるときは、内側(`-outline-offset-1`)に重ねる。不透明の border は背景の色と混ざってぼやけ、塗りの外に枠を足したように見えた(ユーザーが決めた)。
- **`Dialog`**(`primitives/overlays/dialog.tsx`):地の上に重ねる半透明の線と `shadow-overlay` を付け、地を `bg-scrim/40` の backdrop で覆う。dark では scrim がほとんど効かないので、半透明の線で地と分ける。送信中は、Escape と backdrop の押下で閉じない(送った操作の結果を見せるため)。backdrop の高さは、React Aria Components が渡す見えている高さ(`--visual-viewport-height`。スマートフォンのキーボードを除いた高さ)にし、中身は backdrop の中に収めて縦に scroll させる(低い画面や拡大で、ボタンに届かなくならないように)。focus は React Aria Components が閉じ込め、閉じたら開いたボタンに戻す。
- **`Dialog` の animation**:開くときは 200ms、閉じるときは 150ms。本体は opacity と `0.97` から `1` までの scale で出入りする。backdrop は `background-color` の透明度を変えて、本体とは別に濃さを変える。reduced motion では scale を `1` に固定する。React Aria Components は `is-entering` と `is-exiting` の animation が終わるのを待ち、閉じるときは、終わるまで Dialog を取り除かない。閉じ始めたら中身を `inert` にして再送を防ぐ。
- **`overlays/`**:画面に重ねる Dialog と Toast を `primitives/overlays/` にまとめ、`primitives/` の直下を10件に収める。
- **Toast**:操作の結果を `success` と `danger` で知らせ、tone ごとに形の違うアイコンを付ける。`success` の面は、地の上ではっきり見分けられるよう、`scheme-inverse` で画面の配色と逆にし(light では黒い面、dark では白い面)、アイコンに `success` の色を使う。`danger` の面は light でも dark でも `danger-strong` の赤にし、文・アイコン・閉じるボタンを `on-danger-strong` の白にする(どちらもユーザーが決めた)。面と地の色がはっきり分かれるので、半透明の縁の線は付けず、`shadow-overlay` だけを付ける。長い語も折り返し、アイコンと閉じるボタンの中心を文の1行目の中心にそろえる。
- **Toast の focus の ring**:Toast と region の focus の ring は面の外の地の上に描かれるので、地の配色の `focus` で描く。面の配色と塗りは内側の要素に当て、focus を受ける外側の要素は地の配色のままにする。面に `scheme-inverse` を当てると、ring の色も逆の配色で決まり、light の白い地の上で 3:1 に届かなかった。
- **Toast の表示時間と操作**:`success` は読める時間として5000ms表示する。region に hover や focus を始めると、React Aria Components がその時点で出ている Toast の timer を止める。`danger` は、失敗を読み終えられるよう、時間では消さず、閉じるまで残す。どちらも、訳した名前の閉じるボタンですぐに閉じられる。
- **Toast の読み上げと queue**:region の訳と landmark、F6 での移動、`alert` の読み上げ、閉じたときの focus の復帰は React Aria Components に任せる。`UiProvider` の下の `ToastProvider` が、描いた `ToastProvider` ごとに queue を持つ。Toast を出す側は、`useShowToast` が返す関数に、訳した文と `tone` を渡す。これで、画面を描き直すテストや Storybook でも知らせを持ち越さない。
- **Toast の位置**:画面の上の中央に置く(ユーザーが決めた)。狭い画面では `data-top-bar` を付けたナビの帯があるときだけ、帯が占める上端の高さを CSS で `--viewport-top-inset` として渡す。帯の高さはナビの見出しと共通の `h-nav-bar` で決める。Toast はこの値と上の safe area のうち大きいほうから 1rem 空け、ナビのボタンを覆わないようにする。左右は少なくとも 1rem 空け、幅は `max-w-sm`(24rem)までにする。新しい知らせを上に積む。操作の結果が同じ場所に出て、複数あっても順にたどれるようにする。
- **Toast の animation**:React Aria Components の Toast には `is-entering` と `is-exiting` が無いので、queue の `wrapUpdate` で View Transitions を始め、DOM の更新を `flushSync` で反映する。snapshot の準備中に queue が続けて変わったときは、1つの transition で反映する。続けて始めると先の transition が中断され、出入りの前後を撮れないため。opacity を変えながら、入るときは0.5rem上から下り、出るときは0.5rem上へ抜ける。入るときと残った Toast が詰まるときは200ms・`--ease-standard`、出るときは Dialog と共通の150ms・`--ease-exit` を使う。reduced motion では出入りの opacity だけを残す。Toast の transition 中は画面全体を snapshot から外して Dialog などの animation を止めず、snapshot は pointer 操作を受けないようにする。
- **引き出したナビの animation**:開くときは 200ms、閉じるときは 150ms。面は `translate` で幅の分だけ左へ動かし、backdrop は Dialog と同じように濃さを変える。reduced motion では、面の位置を固定して opacity だけを変える。閉じ始めたら中身を `inert` にし、backdrop を押しても閉じないようにする。送信中は結果を見せるため、Escape・backdrop の押下・閉じるボタンで閉じられないようにする。
- **`FocusScope`**:`FocusScope` の中から開いた Dialog を閉じ終えたとき、Dialog を開いたボタンが消えていれば(行ごと削除したなど)、React Aria Components は外側の `FocusScope` の最初の要素に focus を移す。行と一緒に消えるボタンから Dialog を開く欄は `FocusScope` で包み、欄の最初の要素を戻す先にする。`react-aria-components` は `FocusScope` を export しないので、`react-aria` を依存に足す。バージョンは `react-aria-components` が依存するものにそろえる。ずれると `react-aria` が2つ入り、それぞれが別の `FocusScope` の木を持つので、Dialog が外側の `FocusScope` を見つけられない(パスキーの focus のテストで落ちる)。
- **バッジ**(`Badge`):状態を短く示す。用途(`tone`)ごとの色の組は、`Notice` と同じく `/10` の面と、同じ色の線と文字。
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
- JSX の props を spread しない(`{...props}`)。spread で渡した `className` や `style` は、検査が見ない(部品でも同じ)。

### 部品(`ui/` と `features/*/ui/`)

- `app.css` を入口にした Tailwind CSS の設定で生成できない class(Tailwind CSS の既定の色や目盛りなど)。`app.css` は `theme.css` と `animation.css` を読む。
- `[…]` の付く class(任意の値・任意のプロパティ・任意の variant)。値は theme.css の役割か、部品の props で決める。`[&>svg]:size-icon` のような子を選ぶ variant も止める。子の大きさは、子の部品の props で決める。
- `(--name)` で CSS 変数を直接読むこと。読めるのは、実行時に決まる値を渡す変数(React Aria Components の `--trigger-width`・`--visual-viewport-height`、`--progress`・`--media-aspect`・`--media-color`・`--focal-x`・`--focal-y`)だけ。型の付いた読み方(`stroke-(length:--progress)`)も許す。部品が `style` で渡せるのは、`css-variables.tsx` で React の型に足した変数だけ。
- `dark:`(light と dark は `light-dark()` で決める。`not-dark:` のような組み合わせた variant の中も)、`!`(variant の後ろも)、生の `data-*:`・`aria-*:`(状態は `is-*:` の variant を使う。生の variant は名前の順に並び、`data-disabled:` が一番弱くなる。打ち間違いも CSS を出すので、無い class でも止まらない。`group-not-aria-*:` のような組み合わせの中も)、数値の `z-*`(`z-10` など)、型を付けた CSS 変数の文字の大きさ(`text-(length:--x)`。色の `text-(color:--x)` は除く)、数値の `font-*`(`font-500` など)、`outline-none`(`outline-hidden` を使う。forced-colors で線が残る)。
- 余白(gap・padding・margin・scroll の padding と margin)の値は 0・0.5・1・1.5・2・3・4・6・8・12 だけ(margin は `auto` も)。正の上と下の margin(`mt-*`・`mb-*`・`my-*` と、上下にも付く `m-*`)と `space-x/y` は使わず、親の gap で空ける。`0` と `auto` は空きを作らないので許す。子の側で空けると、並べ替えや出し分けのたびに空きが崩れる。負の margin は、はみ出させるために許す。
- `leading-*` と、行間を付けない `text-*`(文字の大きさ)。文字の大きさと太さ(`text-sm/xl`・`font-semibold` など)は、`ui/typography.ts` の文字の役割の対応にだけ書く。対応の中で使える組は、役割で使う6つ(`xs/lg`・`sm/xl`・`sm/2xl`・`base/2xl`・`xl/3xl`・`3xl/5xl`)だけ。`text-sm/5` のような数の行間は、`--spacing` の倍数として通ってしまうので止める。
- `--*: initial` の後も Tailwind CSS が作る class(`duration-150`・`delay-*`・`ease-linear`・`ring-2`・`opacity-50`・`bg-linear-*`・`from-*` など)。`opacity-0` と `opacity-100` は、出入りの動きに使うので許す。
- 色の不透明度の修飾は 5・10・15・20・30・40・60・80 だけ(theme.css の色のほか、`current`・`transparent`・CSS 変数の色にも)。面の色(`canvas`・`surface`・`surface-sunken`)には付けない。面は不透明にすると決めているため。
- 色の見本(`specimens/color-specimen.tsx`)だけは、色ごとに使ってよい utility の決まりと、`line-strong` を `primitives/` の外で止める決まりを外す。どの色も `bg-` で塗って並べるため。見本の正方形の縁は、外周の border でなく、塗りの上に重ねる半透明の線(内側に1px の `outline`、`fg` の 10%)で描く。不透明な `line` の border だと、塗りの外に枠が足されて見えた(ユーザーが決めた)。見本が theme.css の色をすべて並べることを、テスト(`specimens/__tests__/color-specimen.test.tsx`)で確かめる。
- 色ごとに、使ってよい utility を決める。`canvas`・`surface`・`surface-sunken`・`scrim`・`danger-strong` は `bg-` だけ、`line` は `border-`・`divide-`・`outline-` だけ、`line-strong` は `border-` だけ、`danger` は invalid の focus の ring のために `outline-` も、`fg` は面の縁の半透明の線のために `outline-` も、`focus` は `focus-ring` の中だけ、など(一覧は `admin-classes.ts` の `COLOR_USAGE`)。色を取る utility を列挙すると漏れる(`ring-offset-*`・`text-shadow-*` など)ので、末尾が色の名前の class をすべて見て、決めた utility の外を止める。角丸の `rounded-surface` は、色でないので除く。色を足したら、ここにも決まりを足す(テストで止まる)。
- `className` には、文字列のリテラルか、`tv` などで作った関数の呼び出しを渡す。React Aria Components の render props で値を持つ属性を渡すときは、呼び出しを返す関数(`({ placement }) => popover({ placement })`)にする。変数や条件の式を渡すと、class の検査が中身を読めない。
- `style` には、その場で書いたオブジェクトだけを渡し、キーは `--` で始まる CSS 変数だけにする。見た目は class で書き、`style` は実行時に決まる値を CSS 変数として渡すためだけに使う。画像の縦横比は `width`・`height` の属性で付ける。

### ファイル

- CSS のファイルは `src/ui/` にだけ置き、パレットの変数(`--palette-*`)を読めるのは `theme.css` だけ(`apps/admin/__tests__/theme.test.ts`)。
- `--color-*` と `--text-*` の名前は重ねない。重ねると、`text-<名前>` が色か大きさかを Tailwind CSS が取り違える。文字の大きさと行間は、同じ名前の目盛りにする(同じテスト)。

## 割り切ったこと

- **後から出す `status` の知らせ**:`Notice` の `status`(ログインのキャンセルなど)は、中身と一緒に描くので、スクリーンリーダーによっては読まれない(live region は、中身を変える前からあるものが確実に読まれる)。`Notice` はその場に残す知らせで、スクリーンリーダーへの割り込みは要らないので受け入れる。急ぎの誤りは `alert` で読まれる。
- **層の検査が見ない import**:層の境界の lint は、import 文の名前だけを見る。`import("react-aria-components").LinkProps` のような型の中の import と、ほかの層を通した再 export は見ない。どちらも今のコードに無く、追うには依存の木を解く検査が要る。
- **検査が見ない class の渡し方**:JSX の属性と、`tv`・`merge` などの呼び出しの中の文字列だけを検査する。DOM を直に触る `element.classList.add()` や `element.style`、`className` に渡した、`tv` で作っていない関数の戻り値は見ない。今の部品にはどれも無く、要る場面が出たら、そこで使える範囲を決める。参照先まで追う検査は、作る手間に見合わない。
- **入力を受ける部品の枠の濃さ**:入力を受ける部品の枠(`line-strong`)は、地とのコントラストが、部品の枠に要る 3:1 に届かない(light の白の上で約 2.6:1、dark の `surface` の上で約 2.3:1)。3:1 に届く濃さ(パレットに無い灰色や、`fg-muted` の濃さ)より、この濃さをユーザーが選んだ。入力欄は面(`surface`)と影とラベルでも見分けられ、管理者1人が使う画面なので受け入れる。
- **部品と見本の配色の取り違え**:コントラストのテストは theme.css の色の組を確かめ、部品がどの組を使うかは確かめない。`Button` の `danger` を `bg-danger text-on-danger` に戻しても、テストは通る(どちらの組も lint で許す)。色の見本のテストも、theme.css の色の名前が light と dark の欄にそろっていることだけを確かめ、塗りの色が名前と合っているかは確かめない。happy-dom は CSS を読まないので、描いた色を確かめるにはブラウザでのテストが要り、class の名前で確かめるとマークアップをなぞるテストになる。部品と見本の見た目は Storybook で見る。
- **sRGB に入らない色のコントラスト**:コントラストのテストは、sRGB に入らない色(red-700 など)を 0〜1 に clamp して計算する。CSS Color 4 の gamut mapping(彩度を落として収める)で計算すると、4.5:1 の境目の色では、コントラスト比が 0.2 ほど変わることがある(今の塗りは、どれも境目から離れている。`danger-strong` の白い文字は、hover でも 6.0:1)。gamut mapping をテストに入れる手間に見合わないので、境目に近い色を足すときは、両方の計算で確かめる(Codex のレビューで見つかった)。
- **等幅の要素の子の行頭の括弧**:日本語の中の `code` などの子要素(`<code><span>「…」</span></code>`)では、`:lang(ja)` の `trim-start` が子に当たり、行頭の括弧が詰まる。今の画面に等幅の中で括弧から始まる文は無く、詰めない指定を子にまで広げると、字体の切り替えの決まりも組み直しになる(Cursor のレビューで見つかった)。
- **閉じ始めた Dialog に遅れて届く click**:タッチで Dialog の確認のボタンを長押しして離すと、ブラウザが click を出さないので、React Aria Components が 80ms 後に `click()` を呼ぶ。その 80ms のうちに Escape か backdrop で閉じると、閉じる animation の間に残ったボタンに `click()` が届き、中身を `inert` にしていても、押した操作が送られる。マウス・キーボード・普通のタップでは起きず、送られるのは確認のボタンで押した操作そのもの(削除なら、再認証の OS の画面で止められる)。起きる条件が狭いので受け入れる(ユーザーが決めた)。
- **hover の間に足した Toast の timer**:region に hover や focus を始めると、React Aria Components はその時点で出ている Toast の timer を止めるが、その後に足した Toast の timer は止めない。Toast に pointer を置いたまま、ほかの操作の成功が届くと、後から出た `success` の Toast は5秒で消える。起きるのは、Dialog で送った操作の応答を待つ間に、画面の上の Toast へ pointer を動かしたときだけで、消えるまでの5秒は読め、操作の結果は一覧の変化でも分かる。止めるには React Aria Components の timer の作りに逆らう作りが要るので、受け入れる。
- **ログアウトした後に残る Toast**:Toast の queue は、ログインの前と後で共通の `UiProvider` の下にある。`success` の Toast が出ている5秒の間に、すべてのセッションからログアウトすると、ログインの画面にもその Toast が残る。残るのは5秒以内で、中身は利用者自身の操作の結果(今は、閉じるまで残る `danger` の Toast を出す画面は無い)。ログインした後の画面だけで queue を持つには、Toast の Provider の置き場所を route の組み立てと一緒に変える必要があり、手間に見合わないので受け入れる。
- **閉じる animation の間の Tab**:Dialog を閉じ始めると、中身を `inert` にして focus が外れ、React Aria Components は背後の画面の `inert` と focus の閉じ込めを外す。開いたボタンに focus を戻すのは、閉じる animation が終わって Dialog を取り除いたとき。その間(150ms)に Tab を押すと、focus は開いたボタンの次でなく文書の先頭の側へ移り、開いたボタンには戻らない(Chrome と WebKit で確かめた)。閉じる animation の間も focus を Dialog に残すには React Aria Components の振る舞いに逆らう作りが要り、150ms のうちに Tab を押すことは少ないので受け入れる(ユーザーが決めた)。
- **引き出したナビの閉じる animation の間**:上の、Dialog についての2件(遅れて届く click と、閉じる animation の間の Tab)と同じ作りなので、引き出したナビでも同じことが起きる。タッチでリンクかログアウトのボタンを長押しして離し、80ms のうちに Escape か backdrop で閉じると、そのリンクの行き先へ移るか、ログアウトする(ログインし直せば戻れる)。閉じる animation の間(150ms)に Tab を押すと、閉じ終えても開くボタンに focus が戻らない。Dialog と同じ理由で受け入れる。
- **数値として成立しない入力の送信**:数値の入力欄で、保存済みの値を `-` のような未完成の入力に置き換えて送ると、入力欄は直前に確定した値に戻り、その値が送られる(React Aria Components の仕様。Chrome と WebKit で確かめた)。送られる値は、戻った入力欄に見える値と同じで、画面と保存した値はずれない。必須の欄を空にした場合は、必須の誤りになり、送られない。直すには、入力中の文字列を自分で持って検査する必要があり、ライブラリに任せる作りに逆らうので、受け入れる。
- **長いテキストの改行コード**:`CRLF` や `CR` を含む保存済みの本文を `TextArea` の `defaultValue` に渡すと、ブラウザの textarea が改行を `LF` にそろえるので、編集せずに送っても `LF` の本文が送られる(Chrome と WebKit で確かめた)。管理画面で入力した本文は `LF` だけなので、`CRLF` や `CR` が入るのは API で直に保存した本文に限り、文字は変わらず、改行の表し方だけが変わる。元の文字列を持って比べる作りは、textarea の仕様に逆らうので、受け入れる。
- **Windows の和文の太さ**:Windows の和文の字体には 600 が無いものがあり、600 と 700 の区別がつかないことがある(実機では確かめていない)。管理画面は管理者1人が Mac で使うので、受け入れる(ユーザーが決めた)。公開サイトは、作るときに決める。
