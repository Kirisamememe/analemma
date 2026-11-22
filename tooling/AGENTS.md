# tooling

理由は同じフォルダの `DECISIONS.md` にある。

- lint の設定は直下の `oxlint.config.ts` で、中身は `tooling/lint/config/` に分けて置く(ルールの一覧、ワークスペースごとの `overrides`、server の `overrides`、API の制限の部品)。設定のファイルは Node が TypeScript のまま読むので、相対 import に `.ts` を付ける。自作のルールは `tooling/lint/rules/` の `comments/`・`errors/`・`tests/`・`modules/`・`styles/`(`tooling/lint/plugin.mjs` がまとめる)。管理画面の Tailwind CSS の class の検査は `tooling/lint/config/admin-classes.ts`。
- `tooling/lint/config/` のモジュールを直したら、エディタで `Oxc: Restart oxlint Server` を実行する。エディタの Oxlint(LSP)は `oxlint.config.ts` だけを監視し、ほかのモジュールを直しても読み直さない(CLI と CI は毎回読み直す)。
- フォルダの中身の数と名前は、lint ではなく `tooling/structure/` のテストが検査する(1ファイルずつ見る lint では、フォルダ全体を数えられない)。
- `GLOSSARY.md` の「機械で探す語」に挙げた表記は、`tooling/structure/` のテストが文書・コメント・文字列から探す。コミットのメッセージからは、commit-msg の hook が探す。表記を足すときは、別の概念を指す正しい文まで落とさないかを確かめ、落としそうな文を `tooling/structure/__tests__/repository.test.ts` の例に足す。「機械で探す語」の表の見出しや書き方を変えるときは、`tooling/structure/glossary.ts` も合わせて直す。
- ほかのリポジトリの名前は、`tooling/structure/` のテストが、リポジトリの全ファイル(パスと中身)から探す。コミットのときは、git の hook が、ステージしたファイル(パスと中身)とコミットのメッセージからも探す。名前の一覧は、メインの checkout の `.private/other-repositories.txt` に置き、コミットしない(`.private/` は `.gitignore` にある)。worktree からは `git rev-parse --git-common-dir` でたどる。1行に1つの名前を書き、空行と `#` で始まる行は読まない。大文字と小文字は区別しない。一覧が無いときは何も探さない。名前そのものは、コミットするファイルに書かない。
- `tooling/lint/jsdoc-type-plugin.mjs` は eslint-plugin-jsdoc を別の名前で読み込むだけのファイル。`require-jsdoc` を「export する関数と型」と「型の各項目」の2通りの設定で同時に使うため。
- ルールを足したり外したり変えたりしたら、`tooling/lint/fixtures/` の `valid/` と `invalid/` の、ルールの種類ごとのフォルダに fixture を足し、`tooling/lint/__tests__/` の、ルールの種類に合うテストのファイルで確かめる(lint の実行は `tooling/lint/fixture-lint.ts` にまとめてある)。server や管理画面だけに掛かるルールの fixture は、`apps/server/src/` のように同じパスを再現したフォルダに置く。理由は `tooling/DECISIONS.md` に書く。
- fixtures はどの tsconfig にも入れず、`oxlint.fixtures.config.ts`(直下の設定から型付きの lint を外したもの)で検査する。型付きのルールは fixture では確かめられない。`bun test` は fixtures を実行しない(`bunfig.toml`)。
- 型付きのルールは tsrs で動く。型エラーの判定は `tsc` だけで行う。tsrs で困ったら、ユーザーに報告する。`oxlint-tsgolint` に入れ替えると、TS 7.0 と 7.1 の型検査器の食い違いがそのまま残るので、入れ替えるかはユーザーと決める。
- TypeScript の検査と lint のルールがぶつかったら、TypeScript の方を取り、lint のルールを外すか変える(ユーザーが決めた)。外したら、ほかのルールを外したときと同じく、理由を `tooling/DECISIONS.md` に書く。
- `bun run check` は `tooling/check/check.ts`。整形の確認・lint・型検査・テストを順に流す。server のテストを流すかは、一番近いフェーズのブランチか main から分かれた後に変えたファイルで決める(`test-scope.ts`)。server のテストが読む場所を足したら、`test-scope.ts` とそのテストを直す。`--all` で、いつも全部流す(CI)。
- Claude Code では、作業の終わりに `tooling/hooks/stop-check.ts` が `bun run check` を流す(設定は `.claude/settings.json`)。
- 観点ごとのレビューは `tooling/review/` の `bun run review` が流す(進め方は直下の `AGENTS.md` の「ブランチとレビュー」)。prompt は `prompts/` にあり、観点ごとのファイルと、どの観点にも共通の `common.md` に分ける。観点とモデルの割り当ては `perspectives.ts` にある。観点やモデルを変えたら、`perspectives.ts` とそのテスト、直下の `AGENTS.md` の観点の表、`prompts/` の各ファイルの「見ない範囲」に挙げた観点の名前を合わせて直す。結果は、メインの checkout の `.private/reviews/<ブランチ>/` に書く。
- git の hook は `tooling/git-hooks/` にある(中身は同じ名前の `.ts`。pre-merge-commit は `pre-commit.ts` を流す)。`bun install` が、`install.ts` で git の `core.hooksPath` をこのフォルダにする。worktree でも、その worktree のブランチにある hook が流れる。
- pre-commit と pre-merge-commit は、ステージしたファイルのパスと中身から、ほかのリポジトリの名前を探す。整形・lint・型検査・テストは流さない(CI と `bun run check` に任せる)。
- commit-msg は、commitlint(設定は直下の `commitlint.config.ts`、足したルールは `commit-rules.ts`)と、メッセージの中の、ほかのリポジトリの名前と「機械で探す語」の検索を流す。commitlint は Bun で流す。足したルールが `Bun.stringWidth` を使うので、Node では動かない。
- hook を飛ばさない。`git commit --no-verify`(`-n`)を使わず、`core.hooksPath` を外さず、hook を飛ばすための環境変数や設定も足さない。通らなければ直してからコミットする。hook の側に無理があるなら、ユーザーに報告する。
- CI は `.github/workflows/` にある(理由は `tooling/DECISIONS.md` の「CI」)。job の `check`(`check.yml`)は、PR と main への push で `bun install --frozen-lockfile` と `bun run check --all` を流す。job の `commit-messages`(`commit-messages.yml`)は、PR で、PR のコミットのメッセージと、PR のタイトル(merge commit か squash で入れたときの1行目。` (#番号)` を足したもの)を、`tooling/ci/check-pull-request-messages.ts` で確かめる。
- job の名前(`check`・`commit-messages`)は、main とフェーズのブランチの ruleset で、通ることを必須にする check として登録した名前。変えるときは、ruleset も直す(ユーザーに頼む)。
- `commit-messages` は、メッセージを commit-msg の hook のスクリプトに1件ずつ渡すだけ。メッセージの検査を変えるときは `tooling/git-hooks/` を直し、CI の側に検査を書き足さない。
- 手元との違い:CI には、ほかのリポジトリの名前の一覧が無いので、名前を探さない(ファイルからも、メッセージからも)。名前を探すのは、手元の `bun run check` とコミットのときの hook だけ。PR のタイトルは hook を通らないので、PR を作る前に、手元で `printf '%s' '<タイトル>' | bun tooling/ci/check-pull-request-messages.ts --base <base のブランチ> --head HEAD --number <番号の見込み>` に通す。PR の本文と、GitHub の画面で作ったコミットのメッセージは、どの検査も読まないので、名前が無いかを自分で見る。
- workflow では、actions をコミットの SHA で固定し、行末のコメントにバージョンを書く(`uses: owner/repo@<SHA> # v1.2.3`)。`permissions` は最上位に書き、必要最小限にする。どちらも `tooling/structure/` のテストが確かめる。PR のタイトルのような外から来る値は、`${{ }}` で `run` に直接書かず、環境変数で渡す。
