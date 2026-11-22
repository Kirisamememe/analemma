# Analemma

個人サイトのためのヘッドレス CMS。

毎日同じ時刻の太陽の位置を1年間記録すると、空に「8の字」が描かれる。その図形の名前がアナレンマ。日々の記録が積み重なって、はじめて見える軌跡。

## 構成

| 名前     | 役割                                                                | 場所                                  |
| -------- | ------------------------------------------------------------------- | ------------------------------------- |
| Analemma | CMS の本体。Bun で動く                                              | `apps/server`                         |
| Stilus   | 管理画面。React の SPA                                              | `apps/admin`                          |
| —        | API の contract(zod のスキーマと型)                                 | `packages/contract`                   |
| —        | 公開サイト向けの型付き SDK と、種類の定義を送る CLI(npm で公開する) | `packages/client`(`@analemma/client`) |
| —        | 開発のツール(lint の自作のルール、git の hook)                      | `tooling`                             |

- フォルダの名前とパッケージ名は役割の名前にする。Analemma・Stilus は愛称で、README・ログ・画面の表示に使う。
- 公開サイト(Amayadori)は別のリポジトリで、`@analemma/client` だけを使う。
- 本番は server のプロセス1つで、外部用のポートから `/api` と管理画面の静的ファイルを同じ origin で配信する。公開 API は、サーバーの外から届かない内部用のポートで、公開サイトのサーバーにだけ返す。

決めたことの理由は、関係するコードに一番近いフォルダの `DECISIONS.md` にある(リポジトリ全体は [DECISIONS.md](DECISIONS.md))。エージェント向けの指示は `AGENTS.md`。

## 開発

[Bun](https://bun.com) と Docker(Docker Compose)と Node.js 24.15 以上を使う。server のテストを流すときは、Docker でテスト用の PostgreSQL を起動するので、Docker が動いていないと `bun run check` は失敗する。Oxlint は Node で動き、TypeScript で書いた設定(`oxlint.config.ts`)を Node の type stripping で読む。エディタの Oxc の拡張が別の Node を使うときは、拡張の設定 `oxc.path.node` で Node を指定する。

```bash
bun install
```

`bun install` は、コミットのときに検査を流す git の hook も入れる(git の `core.hooksPath` を `tooling/git-hooks` にする)。

```bash
bun run check
```

| コマンド            | 中身                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bun run check`     | 整形の確認・lint・型検査・テストを順に流す。`apps/server/`・`packages/`・`compose.yaml` に触れていない変更では、server のテストを流さない。`--all` を付けると全部流す(CI)      |
| `bun run format`    | oxfmt で整形する                                                                                                                                                               |
| `bun run lint:fix`  | Oxlint で自動で直せるものを直す                                                                                                                                                |
| `bun run typecheck` | リポジトリの直下の tsconfig と、各ワークスペースの tsconfig を検査する                                                                                                         |
| `bun run test`      | テスト用の PostgreSQL を Docker Compose で起動し、migration を適用したテンプレートの DB を用意してから、`bun test` を流す。管理画面のテストは、続けて `apps/admin` で流す      |
| `bun run review`    | ブランチを、観点を1つ選んでレビューする(Codex・Cursor の CLI で流す。言葉の観点は、Claude の subagent に渡す prompt を書き出す。進め方は `AGENTS.md` の「ブランチとレビュー」) |

server を手元で動かすときは、開発用の PostgreSQL を起動し、migration を適用してから起動する。

```bash
docker compose up -d --wait postgres
```

```bash
cp apps/server/.env.example apps/server/.env
```

```bash
bun --cwd=apps/server run db:migrate
```

```bash
bun --cwd=apps/server run dev
```

管理画面へのログインは、パスキーだけで行う。最初のパスキーの登録と、パスキーを全部失ったときの復旧は、server のコマンドが出す登録用 URL で行う。

```bash
bun --cwd=apps/server run passkey:enroll
```

| コマンド(`apps/server` で流す) | 中身                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| `bun run db:migrate`           | まだ適用していない migration を適用する。server の起動とは別に、1回だけ流す |
| `bun run db:generate`          | テーブルの定義(`src/db/schema/`)から migration を作る(drizzle-kit)          |
| `bun run passkey:enroll`       | 管理者のパスキーを登録するための、1回きりで10分だけ使える登録用 URL を出す  |
| `bun run test:prepare`         | `bun run test` が `bun test` の前に流すもの                                 |

管理画面(Stilus)は、Vite の開発のサーバーで動かす。`/api` は server へ流すので、server も起動しておく。ブラウザでは `http://localhost:5173` を開く(`127.0.0.1` ではパスキーが使えない)。

```bash
bun --cwd=apps/admin run dev
```

| コマンド(`apps/admin` で流す) | 中身                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `bun run dev`                 | 開発のサーバーを `http://localhost:5173` で起動する  |
| `bun run build`               | 本番の静的ファイルを `dist/` に書き出す              |
| `bun run test`                | 管理画面のテストを、DOM(happy-dom)を用意してから流す |
