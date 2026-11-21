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

## route はコードで定義する

TanStack Router の、ファイルから route を作る仕組み(`routeTree.gen.ts` を生成する plugin)は使わず、`src/router.tsx` で `createRoute` を組む。

- 生成するファイルは、整形・lint・用語集の検査から外す設定が要り、生成し忘れると型が古いまま残る。
- ファイルの名前に `__root.tsx`・`$id.tsx`・`_layout.tsx` のような形を求めるので、kebab-case の検査とぶつかり、route が増えると1つのフォルダに10件を超えて並ぶ。
- route の型(`Link` の `to` など)は、コードで組んでも同じように付く。型を登録する `declare module` の `interface Register` は、宣言のマージでしか書けないので、`consistent-type-definitions` をその1行だけ抑制している。

## code splitting はしない

route ごとの `lazy(() => import(…))` は使わず、`no-dynamic-import` をそのまま効かせる。管理画面を使うのは管理者1人で、全部を1つの bundle にしても大きくない(React と TanStack Router で約 300 KB、gzip で約 96 KB)。`import()` を許すと、境界を守る `no-restricted-imports` を動的な import ですり抜けられる(`tooling/DECISIONS.md`)。エディタのような大きなライブラリを入れるときに、決め直す。

## 言語と配色を最初の描画の前に当てる

html の `lang` と `data-theme` は、React が描き始める前に、`index.html` の head の script で当てる。React の中で当てると、利用者が OS と違う配色を選んでいたときに、最初の描画が OS の配色で出てから切り替わる。

- 当てる値は、`localStorage` に利用者が選んだ値があればそれ、無ければ言語はブラウザの言語の並びから選び、配色は OS に従う(`data-theme` を付けない)。決める関数(`src/preferences/resolve-preferences.ts`)は純粋関数にしてテストする。
- script は `src/preferences/boot.ts` を、`vite.config.ts` の plugin が、Vite の lib のビルドで1つの IIFE にまとめ、head に直接書き込む。TypeScript のまま書いてテストでき、`src/i18n/` と同じ言語の判定を使える。module の script は後回しに流れるので、最初の描画の前に流すには、module でない script にする必要がある。
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
- ブラウザの言語の並びから選ぶときは、`Intl.Locale` の `maximize()` で言語と文字体系の組にしてから比べる。`zh-CN`・`zh-SG`・`zh` は `zh-Hans`、`ja-JP` は `ja` になる。`zh-TW`・`zh-HK` は文字体系が違う(繁体字)ので、`zh-Hans` に寄せず、並びの次の言語に進む。どれにも対応していなければ英語にする。
- `Intl.Locale` が読めない tag(`i-klingon` など。BCP 47 では正しくても、Intl が受け付けないものがある)は、飛ばして次の言語に進む。head の script の中で throw すると、言語と配色のどちらも当たらなくなる(Codex のレビューで見つかった)。
- 利用者が選んだ言語と配色は、`localStorage` の `analemma:locale`・`analemma:theme` に置く。server には送らない。管理者は1人で、端末ごとに違ってよい。

## 開発のときの API

開発では、Vite の開発のサーバー(`http://localhost:5173`)が、`/api/` で始まるパスを server の外部用のポート(`http://localhost:8787`)へ流す。

- ブラウザから見ると、管理画面と API は同じ origin になる。server は、`admin` と `auth` の procedure で、次を確かめる(`apps/server/DECISIONS.md` の「入口の守り」)。GET 以外では、Origin が `AUTH_ORIGIN` と完全に一致すること。GET も含め、ブラウザが `Sec-Fetch-Site` を付けたなら、それが `same-origin` であること。Vite は Origin・`Sec-Fetch-Site`・Host をそのまま流し、server の `Set-Cookie` もそのまま返すので、server の `.env.example` の `AUTH_ORIGIN`(`http://localhost:5173`)のままで通る。`changeOrigin` は使わない。この振る舞いは、作り物の server を立てたテスト(`__tests__/vite-config.test.ts`)で確かめる。
- 流すのは `/api/` で始まるパスだけにする(`^/api/`)。Vite は文字列のキーを前方一致で比べるので、`/api` と書くと `/api-guide` のような画面のパスまで server へ流れる。
- 開発のサーバーの origin が `AUTH_ORIGIN` と食い違うと、すべてのログインが 403 になるので、`vite.config.ts` の origin と server の `.env.example` の `AUTH_ORIGIN` が同じことを、テストで確かめる。ポートが空いていなければ、別のポートに移らずに止まる(`strictPort`)。
- `127.0.0.1` で開くと、origin が `AUTH_ORIGIN` と食い違い、RP ID(`localhost`)ともずれるので、`localhost` で開く。
- 本番のビルドを確かめる `vite preview` も、開発のサーバーと同じ origin(`http://localhost:5173`)とプロキシにする。preview は既定では別のポート(4173)で開くのに、開発のプロキシをそのまま引き継ぐ。origin が `AUTH_ORIGIN` と食い違うと POST は断られる一方、Cookie はポートを区別しないので、開発でログインした Cookie で GET は通ってしまう(Codex のレビューで見つかった)。2つは同時には動かせない。
- 公開 API とデプロイ用 API は、管理画面からは呼ばない。server が内部用のポートを持ったら(server の PR で足す)、そちらで受けるので、開発のプロキシからも届かなくなる。

## server の API の呼び方

- server の API は、contract の型を付けた oRPC の client(`src/api/create-api-client.ts`)で、同じ origin の `/api` に、oRPC のプロトコルで呼ぶ。応答の型を手で書かない。
- server の状態は TanStack Query で持つ。query client(`src/api/create-query-client.ts`)は、取得と送信のどちらかがセッションの無いこと(`UNAUTHORIZED`)を返したら、持っている状態を消して、ログインの画面に、今のパスを持たせて移す。セッションの無い失敗は、やり直さない。
- 画面に focus が戻っても、取り直さない(`refetchOnWindowFocus: false`)。パスキーの操作は OS の画面を開くので、ログインの最中に focus が出入りし、取り直すと、ログインの最中にほかの管理用 API を呼ぶことになる(「server の認証に合わせること」)。
- 送信の失敗は、やり直さない。登録やログインを2回送ると、使い切った challenge で失敗する。
- 送信と取得は、オフラインでも止めておかずに送り、失敗をその場で返す(`networkMode: "always"`)。TanStack Query の既定では、オフラインで確定した送信を止めておき、つながったときに確かめずに送る(すべてのセッションからのログアウトなどが、利用者の知らないうちに送られる。Codex のレビューで見つかった)。取得も止めておくと、送信の後に一覧を取り直す処理が待ったままになり、送信が終わらない(Copilot のレビューで見つかった)。

## ログインとセッション

- route を、ログインの前の画面(`/login`・`/enroll`)と、ログインした後の画面(`signed-in` の下)に分ける。ログインした後の画面は、開く前に `admin.session.get` でセッションを確かめ、無ければログインの画面に、元のパスを `redirect` に持たせて移る。移るたびに確かめるのは、管理者が1人で数が少なく、切れたことにすぐ気づけるため。
- ログインした後は、まだログインの画面にいるときだけ、`redirect` のパスに戻る(応答を待つ間に履歴でほかの画面へ移っていたら、そこから動かさない)。ログインの画面にいるかは、パスを比べずに、router が今の route として選んだかで確かめる。router は大文字と小文字を区別せず、末尾の `/` も受け付けるので、パスを比べると `/LOGIN` や `/login/` で食い違った(Copilot のレビューで見つかった)。登録用 URL の画面も同じ。管理画面の中の、ログインした後の画面のパス(`/` で始まり、`//`・`/\` で始まらず、ログインと登録用 URL の画面でないもの。大文字と小文字は区別しない。router が区別せずに照らし合わせるので)だけを受け付け、ほかは捨てる(外のサイトに移させない)。
- セッションが無いという応答(401)が、ログインの前の画面(`/login`・`/enroll`)を開いているときに届いたら(前の画面から遅れて届いた 401)、状態を消すだけで、ログインの画面には移らない。登録用 URL の画面から移ると、`redirect` に URL の `#` の後ろの token まで入り、URL の search params として server に届いてしまう(Codex のレビューで見つかった)。
- ログインと登録の流れ(`src/features/auth/log-in.ts`・`enroll.ts`)は、server の API と認証器を受け取る関数にし、作り物で単体テストする。server の失敗のうち、利用者に伝えるもの(期限切れ・登録されていないパスキーなど)は `_tag` の結果にし、origin の食い違いのような設定の誤りは throw する(画面には「ログインできませんでした」と出る)。
- 認証器(`src/features/auth/webauthn/create-authenticator.ts`)は、`navigator.credentials` を受け取り、options と資格情報を、server の base64url の形とブラウザの形のあいだで変える。base64url の変換は `atob`・`btoa` で書く。`Uint8Array` の `fromBase64`・`toBase64` は Safari 18.2 からで、CSS の下限(Safari 17.5)のブラウザでログインできなくなる。`PublicKeyCredential.parseRequestOptionsFromJSON()` と `toJSON()` は使わない。どちらも出てから日が浅く、`toJSON()` の戻り値には型が無い(`any`)。キャンセル(`NotAllowedError`・`AbortError`、`AbortSignal.timeout()` で止めたときの `TimeoutError`)と、登録済みの認証器(`InvalidStateError`)は、想定内の結果として返す。
- **登録用 URL の形**:`{AUTH_ORIGIN}/enroll#{token}` に決めた(server のコマンドが出す形のまま)。
- 登録用 URL の画面は、開いたらすぐに token をメモリに移し、URL と履歴から `#` の後ろを消す(`replace`)。登録の最中に履歴を移ってから成功の `replace` が走ると、移った先の履歴を書き換えてしまうので、成功したときは、登録の画面にいるときだけホームに移る。開き直すと token は無いので、コマンドで出し直す。開いたまま新しい登録用 URL を開いたときは(`#` の後ろだけが変わるので、ブラウザは読み込み直さない)、新しい token に替え、前の登録の知らせを消す。期限切れの URL の後に出し直した URL を同じタブに貼ると、こうなる。
- パスキーの名前は、認証器でパスキーを作る前に、contract と同じスキーマ(`passkeyName`)で確かめ、入力欄に誤りを出す。作った後で server に名前を断られると、認証器に、ログインに使えないパスキーが残る。
- ログインした後の画面で、セッションを確かめる API が 401 以外で失敗したら(server が落ちているなど)、訳した知らせと、やり直すボタンを出す(router の既定の画面は英語で、やり直せない)。
- ログアウトしたら、持っている状態を消して、ログインの画面に移る。

## パスキーとセッションの管理

- 画面は `/security`(セキュリティ)。パスキーの一覧・足す・名前を変える・消すと、すべてのセッションからのログアウトを置く。
- 足すときと消すときは、操作の前に、今のパスキーで確かめ直す(再認証。`src/features/auth/reauthenticate.ts`)。足すときは、再認証の後に新しいパスキーを作り、2つの資格情報を一緒に送る。再認証の結果は server に覚えられないので、1つの再認証で1回だけ操作できる。名前の変更と、すべてのセッションからのログアウトには求めない(server の決まり)。
- 消すことと、すべてのセッションからのログアウトは、取り消せないので、確かめの画面(Dialog)を出してから送る。足すときと名前を変えるときも、入力のために Dialog を使う。
- 失敗(再認証できない・最後のパスキー・もう無いパスキーなど)は、Dialog を開いたまま、その中に知らせる。成功したら Dialog を閉じ、画面に知らせを残す(操作の結果を知らせる Toast を足したら、そちらに移す)。次の操作を始めたら、前の知らせは消す。閉じてから開き直した Dialog には、前の失敗を出さない。
- server が答えたら(取り消しのほかは)、成功でも失敗でも一覧を取り直す。再認証に使ったパスキーの最後に使った日時は、操作が断られても書き換わる。取り直す前に、送っている一覧の取得を取り消す。最初の取得が操作より前の一覧を読んで遅れて届くと、取り直しがその取得を使い回し、足したパスキーが一覧に出なかった(Codex のレビューで見つかった)。
- 名前を変える・消す Dialog を閉じたとき、そのパスキーが一覧から消えていたら(消した・ほかの画面で消されていた・一覧を読み込めずに知らせに替わった)、消えた行の操作の代わりに「パスキーを足す」に focus を移す。Dialog は閉じると開いたボタンに focus を戻すが、そのボタンは行ごと消えている。
- パスキーを足すとき、新しいパスキーを作る時間を、再認証の challenge が切れる時刻の手前までに絞り、残りが30秒より少なければ、作らずに期限切れとして返す。WebAuthn の `timeout` はブラウザが変えてよい目安なので、`AbortSignal` でもその時刻に作るのを止め、止めたときは期限切れとして返す。再認証と登録の challenge は別々に5分で、再認証に時間をかけると、パスキーを作れても server が再認証の期限切れで断り、認証器に使えないパスキーが残る。
- パスキーの名前は、ログインの前の登録と同じく、contract の `passkeyName` で、作る前に確かめる。
- パスキーを消すと、server は今のセッションのほかをすべてログアウトさせるので、そのことも知らせる。

## テスト

マークアップの作りをなぞるだけのテストは書かない。実装をなぞるテストは、実装を変えるたびに直すだけで、何も守らない。

- ロジックはできる限りマークアップから分けて `.ts` に置き、テストを必ず書く。`.ts` から React を import できないようにして、`.ts` をテストできるロジックだけにする。
- ロジックに切り出しにくい出し分けは、コンポーネントのテストで確かめる。要素は role・label・text など利用者に見えるもので探し、利用者に見える結果を確かめる。test id、DOM のたどり方、クラス名、スナップショットのように、マークアップの作りに依存する探し方と確かめ方は使わない。
- 出し分けの無いコンポーネントには、テストを求めない。
- 決まった文言を描画して確かめるだけのテストは lint を通ってしまうので、セルフレビューで見る。
- 管理画面の `src/` のテストは、リポジトリの直下の `bun test` から外し(直下の `bunfig.toml`)、`apps/admin` で別に流す(`apps/admin/bunfig.toml` の `root` を `src` にする)。DOM(happy-dom)を用意する preload を、画面のコードのテストにだけ掛けるため。happy-dom は `fetch`・`Request`・`Response`・`setTimeout` などのグローバルを置き換えるので、直下で掛けると server のテストまで happy-dom の上で流れる。`bunfig.toml` は、`bun test` を流すフォルダのものだけが読まれる(手元で確かめた)。
- Vite の設定とビルドのテスト(`apps/admin/__tests__/`)は、直下の `bun test` で、DOM なしで流す。Vite は Node の `setTimeout` を前提にしていて(`unref()` を呼ぶ)、happy-dom の上では開発のサーバーが起動しない。
- 画面のテストは、`src/testing/render-app.tsx` で、作り物の server と作り物の認証器につないだ管理画面の全体(router・query client・言語)を描く。パスキーの画面のテストには、パスキーとセッションの procedure を状態ごと真似る作り物(`create-passkey-routes.ts`。1つの再認証で1回だけ操作できる・無いパスキーは `NOT_FOUND`・最後のパスキーは `LAST_PASSKEY`・すべてのセッションからログアウトした後は `UNAUTHORIZED`)と、決めた答えを返す作り物の認証器(`create-fake-authenticator.ts`)を使う。作り物の server(`create-fake-api.ts`)は、oRPC のプロトコルの応答(成功と、contract に定義した失敗と、定義していない失敗)を返し、無い procedure には本物の server と同じくテキストの 404(`text/plain`)を返す。client は本物を使う。画面・router・client のつなぎを、利用者に見える結果と、呼ばれた procedure の並びで確かめられる。`src/testing/` は、テストだけが import できる(`tooling/structure/` のテストが止める)。
- tsconfig を2つに分ける。`tsconfig.app.json` は、テストを除いた `src/` を、Bun の型なしで検査する(画面のコードが Bun の API の型を読めないように)。`tsconfig.json` は、テスト・`vite.config.ts`・`test-setup/` を含めて Bun の型で検査し、型付きの lint もこちらを使う。

## server の認証に合わせること

server の判断は `apps/server/src/features/auth/DECISIONS.md` にある。

- **送信中はボタンを無効にする**:パスキーの削除などを続けて送ると、先のリクエストで成功しても、後のリクエストが失敗を返すことがある(使い切った再認証の資格情報、消えたセッションなど)。server ではそろえないので、画面の表示と結果が食い違わないよう、送らせない。
- **ログインの最中に、ほかの管理用 API を呼ばない**:期限を延ばした応答と、ログインし直した応答が逆の順で届くと、新しい Cookie が古い token で上書きされうる。server では防がないので、ログインの最中に、期限を延ばしうるリクエストを送らない。管理画面では、gate(`src/features/auth/create-auth-gate.ts`)が守る。ログインと登録用 URL からの登録は、送っている管理用 API が終わるのを待ってから始め、その最中の管理用 API(`/api/admin/` へのリクエスト)は、終わるまで待ってから送る。ログインの画面で履歴を進めて、ログインした後の画面のセッションの確認が走っても、ログインを追い越さない(Codex のレビューで見つかった)。
- **登録用 URL の画面**:最初の登録と復旧は、server のコマンドが出す登録用 URL で行う。token を `#` の後ろに置くのは、server のアクセスログや Referer に残さないため。画面は、token を読んで options を取り、パスキーを作らせて登録する。

## 割り切ったこと

- **開発のときの head の script**:開発のサーバーは、HTML を返すたびに、head の script を Vite の lib のビルドでまとめ直す(数十ミリ秒)。まとめた結果を使い回すと、`src/preferences/boot.ts` と、それが読むファイルを直したときに開発のサーバーを起動し直す必要がある。待ち時間が気になったら、依存が変わったときだけまとめ直す形にする。
- **`localStorage` が使えないブラウザ**:head の script は、`localStorage` を読めないと(ストレージを切った設定など)throw し、言語と配色を当てずに終わる。React は html の `lang` が無ければ英語にするので、画面は英語で出る。管理者が自分のブラウザで使うだけなので、受け入れる。
- **ほかのタブの管理用 API**:ログインの最中に管理用 API を送らせない gate は、タブごとにある。ほかのタブが同じ時に管理用 API を送ると、その応答の `Set-Cookie`(期限を延ばした古い token、または切れたセッションを消す指示)が、ログインした応答の後に届き、新しい Cookie を上書きしうる。起きても、次の操作が 401 になってログインし直すだけで、管理者は1人で、ログインの最中にほかのタブを操作することは少ない。タブをまたいで止めるには、Web Locks API などで管理用 API を全部くるむ必要があり、手間に見合わないので受け入れる。
