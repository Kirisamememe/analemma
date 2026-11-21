# tooling

理由は同じフォルダの `DECISIONS.md` にある。

- lint の設定は `.oxlintrc.json`、自作のルールは `tooling/lint/rules/` の `comments/`・`errors/`・`tests/`・`modules/`(`tooling/lint/plugin.mjs` がまとめる)。
- フォルダの中身の数と名前は、lint ではなく `tooling/structure/` のテストが検査する(1ファイルずつ見る lint では、フォルダ全体を数えられない)。
- `GLOSSARY.md` の「機械で探す語」に挙げた表記は、`tooling/structure/` のテストが文書・コメント・文字列から探す。コミットのメッセージからは、commit-msg の hook が探す。表記を足すときは、別の概念を指す正しい文まで落とさないかを確かめ、落としそうな文を `tooling/structure/__tests__/repository.test.ts` の例に足す。「機械で探す語」の表の見出しや書き方を変えるときは、`tooling/structure/glossary.ts` も合わせて直す。
- ほかのリポジトリの名前は、`tooling/structure/` のテストが、リポジトリの全ファイル(パスと中身)から探す。コミットのときは、git の hook が、ステージしたファイル(パスと中身)とコミットのメッセージからも探す。名前の一覧は、メインの checkout の `.private/other-repositories.txt` に置き、コミットしない(`.private/` は `.gitignore` にある)。worktree からは `git rev-parse --git-common-dir` でたどる。1行に1つの名前を書き、空行と `#` で始まる行は読まない。大文字と小文字は区別しない。一覧が無いときは何も探さない。名前そのものは、コミットするファイルに書かない。
- `tooling/lint/jsdoc-type-plugin.mjs` は eslint-plugin-jsdoc を別の名前で読み込むだけのファイル。`require-jsdoc` を「export する関数と型」と「型の各項目」の2通りの設定で同時に使うため。
- ルールを足したり外したり変えたりしたら、`tooling/lint/fixtures/` の `valid/` と `invalid/` の、ルールの種類ごとのフォルダに fixture を足し、`tooling/lint/__tests__/` の、ルールの種類に合うテストのファイルで確かめる(lint の実行は `tooling/lint/fixture-lint.ts` にまとめてある)。server や管理画面だけに掛かるルールの fixture は、`apps/server/src/` のように同じパスを再現したフォルダに置く。理由は `tooling/DECISIONS.md` に書く。
- fixtures はどの tsconfig にも入れず、`oxlint.fixtures.config.mjs` で型を使わずに検査する。型付きのルールは fixture では確かめられない。`bun test` は fixtures を実行しない(`bunfig.toml`)。
- 型付きのルールは tsrs で動く。型エラーの判定は `tsc` だけで行う。tsrs で困ったら、ユーザーに報告する。`oxlint-tsgolint` に入れ替えると、TS 7.0 と 7.1 の型検査器の食い違いがそのまま残るので、入れ替えるかはユーザーと決める。
- TypeScript の検査と lint のルールがぶつかったら、TypeScript の方を取り、lint のルールを外すか変える(ユーザーが決めた)。外したら、ほかのルールを外したときと同じく、理由を `tooling/DECISIONS.md` に書く。
- Claude Code では、作業の終わりに `tooling/hooks/stop-check.ts` が `bun run check` を流す(設定は `.claude/settings.json`)。
- git の hook は `tooling/git-hooks/` にある(中身は同じ名前の `.ts`。pre-merge-commit は `pre-commit.ts` を流す)。`bun install` が、`install.ts` で git の `core.hooksPath` をこのフォルダにする。worktree でも、その worktree のブランチにある hook が流れる。
- pre-commit と pre-merge-commit は、ステージしたファイルのパスと中身から、ほかのリポジトリの名前を探す。整形・lint・型検査・テストは流さない(CI と `bun run check` に任せる)。
- commit-msg は、commitlint(設定は直下の `commitlint.config.ts`、足したルールは `commit-rules.ts`)と、メッセージの中の、ほかのリポジトリの名前と「機械で探す語」の検索を流す。commitlint は Bun で流す。足したルールが `Bun.stringWidth` を使うので、Node では動かない。
- hook を飛ばさない。`git commit --no-verify`(`-n`)を使わず、`core.hooksPath` を外さず、hook を飛ばすための環境変数や設定も足さない。通らなければ直してからコミットする。hook の側に無理があるなら、ユーザーに報告する。
