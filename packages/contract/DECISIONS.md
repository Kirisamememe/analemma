# 決めたことと理由(contract)

## npm で公開する形

client の型(`.d.ts`)は contract を import するので、利用者は client と一緒に contract も入れる(`packages/client/DECISIONS.md` の「npm で公開する形」)。公開の手順はまだ決めていない(直下の `AGENTS.md` の「まだ決めていないこと」)が、`bun pm pack` で、公開するときと同じ `.tgz` に、手を加えずに固められるようにしておく。

- 型は build した `.d.ts`(`dist/types/`)で出し、実行するコードは TypeScript のソース(`src/`)のまま出す。
  - 型をソースのまま出すと、利用者の tsc が、contract のソースを利用者の設定(lib・TypeScript のバージョン・strict の外の検査)で検査する。合わない設定では、利用者の型検査が contract の中で落ちる。`skipLibCheck` が飛ばすのは `.d.ts` だけで、`node_modules` の中の `.ts` は検査する(実測)。`.d.ts` なら、利用者の tsc は宣言を読むだけになる。
  - 実行するコードは、client の利用者には読まれない。client は SDK と CLI の bundle に contract を含めるので、client の JS は contract を import しない。
  - 実行するコードまで build した JS にすると、リポジトリの中(server・管理画面・client のテストと build)にソースを読ませる仕組みが要る。condition で分けるには、Bun は condition を設定のファイルから読まないので、Bun を流すすべてのコマンド(server の起動・テスト・スクリプト)に `--conditions` を付けることになる(実測)。付け忘れたコマンドは、`dist/` に残った古い JS を黙って読む。
- `exports` は、リポジトリの中でだけ使う condition `@analemma/source` と `default` をソースに、`types` を `.d.ts` に向ける。リポジトリの tsc は、`tsconfig.base.json` の `customConditions` でこの condition を読み、`dist/types/` があってもソースを検査する(condition が無いと、`dist/types/` があるときは、その型を読む。実測)。Bun・Vite・Bun の build は `types` を読まないので、`default` のソースを読む。
- `files` は、`dist/types` と、テストを除いた `src` にする。tsconfig(リポジトリの外の `tsconfig.base.json` を extends する)とテストは入れない。
- `dist/types/` は、contract の build が作り直す。build は、`bun pm pack` の `prepack` と、client の build が流す。
  - client のフォルダをつないで使う公開サイト(client の README の「開発」)の tsc は、client の `.d.ts` から、contract の `types` の `.d.ts` を読む。client を build し直すたびに contract の `.d.ts` も作り直し、client の型と contract の型を同じソースにそろえる。
  - 固めた後に `.d.ts` を消す形は採らない。固めるのが途中で失敗すると `postpack` が流れず、古い `.d.ts` が残るため。
  - build は、先に `dist/types/` を消す。消したソースの `.d.ts` を残さないため。消すのも、固めたものに入れるのも `dist/types/` だけにする。`bun pm pack --destination ./dist` で `dist/` に書き出した `.tgz` を、次の build(client の build を含む)で消さず、次に固めたものにも入れないため。
- `version` を持たせる。`bun pm pack` と `bun publish` は、client の `workspace:*` を contract の `version` に書き換えるので、無いと client を固められない。`private: true` は、client と同じく、公開するときに外す。
- 固めたものに、テストを除いたソースと、ソースごとの `.d.ts` と、README と package.json だけが入ること、`exports` の指すファイルがどれも入ること、利用者の TypeScript が読む型が `.d.ts` であること(`exports` の condition の順)を、テスト(`__tests__/pack.test.ts`)で確かめる。client の build が contract の `.d.ts` を作り直すことは、client のテストで確かめる。テストは `bun pm pack` を Bun の API で流すので、`src/`(Bun と Node の API を使えない)の外に置く。

## 割り切ったこと

- **contract を Node で直に import する利用者**:`default` が TypeScript のソースを指すので、Node は import できない(`node_modules` の中の型を取り除かない。`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`)。Bun と、ソースを変換する bundler(Vite など)では動く。公開サイトは client を通して使い、client の JS は contract を import しないので、困る利用者はいない。contract を直に使う利用者が出たら、JS を build して、リポジトリの中で condition を付ける方法と比べ直す。
- **`moduleResolution` が `node16` の利用者**:`.d.ts` の相対 import は拡張子を持たないので、型を解決できない。client と同じ扱いにし、npm で公開する手順と一緒に決める(`packages/client/DECISIONS.md` の「割り切ったこと」)。
