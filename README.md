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
- 本番は server のプロセス1つで、外部用のポートから `/api` と管理画面の静的ファイルを同じ origin で配信する(`ADMIN_DIST_DIR` に管理画面のビルドを指定する)。公開 API は、サーバーの外から届かない内部用のポートで、公開サイトのサーバーにだけ返す。本番の置き場所は、まだ決めていない。手元で本番の形を試す手順は、下の「本番の形で試す」にある。

決めたことの理由は、関係するコードに一番近いフォルダの `DECISIONS.md` にある(リポジトリ全体は [DECISIONS.md](DECISIONS.md))。エージェント向けの指示は `AGENTS.md`。

## 開発

[Bun](https://bun.com) と Docker(Docker Compose)と Node.js 24.15 以上と libheif のコマンド(`heif-dec`)と FFmpeg 8 以上を使う。server のテストを流すときは、Docker でテスト用の PostgreSQL を起動するので、Docker が動いていないと `bun run check` は失敗する。Oxlint は Node で動き、TypeScript で書いた設定(`oxlint.config.ts`)を Node の type stripping で読む。エディタの Oxc の拡張が別の Node を使うときは、拡張の設定 `oxc.path.node` で Node を指定する。

```bash
bun install
```

`bun install` は、コミットのときに検査を流す git の hook も入れる(git の `core.hooksPath` を `tooling/git-hooks` にする)。

server は、HEIC の写真を `heif-dec` で PNG にしてから変換する。ICC の無い AVIF と、cICP で色を指定した PNG は、FFmpeg で写真が指定した色域から Display P3 に変換する。server のテストも両方のコマンドを使うので、入っていないと `bun run check` は失敗する。Mac では Homebrew で入れる(CI では workflow が入れる)。

```bash
brew install libheif ffmpeg
```

```bash
bun run check
```

| コマンド            | 中身                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run check`     | 整形の確認・lint・型検査・テストを順に流す。server のテストが読む場所(`apps/server/`・`packages/`・直下の共有のファイル)に触れていない変更では、server のテストを流さない。`--all` を付けると全部流す(CI) |
| `bun run format`    | oxfmt で整形する                                                                                                                                                                                          |
| `bun run lint:fix`  | Oxlint で自動で直せるものを直す                                                                                                                                                                           |
| `bun run typecheck` | リポジトリの直下の tsconfig と、各ワークスペースの tsconfig を検査する                                                                                                                                    |
| `bun run test`      | テスト用の PostgreSQL を Docker Compose で起動し、migration を適用したテンプレートの DB を用意してから、`bun test` を流す。管理画面のテストは、続けて `apps/admin` で流す                                 |
| `bun run review`    | ブランチを、観点を1つ選んでレビューする(Codex・Cursor の CLI で流す。進め方は `AGENTS.md` の「ブランチとレビュー」)                                                                                       |

server を手元で動かすときは、開発用の PostgreSQL を起動し、migration を適用してから起動する。

```bash
docker compose up -d --wait postgres
```

```bash
cp apps/server/.env.example apps/server/.env
```

配信用の画像は、`MEDIA_DIR` のフォルダに置く。server は、フォルダが無いと起動しない。

```bash
mkdir -p apps/server/media
```

```bash
bun --cwd=apps/server run db:migrate
```

```bash
bun --cwd=apps/server run dev
```

管理画面へのログインは、パスキーだけで行う。最初のパスキーの登録と、パスキーを全部失ったときの復旧は、server のコマンドが出す登録用 URL で行う。登録用 URL で登録すると、ほかのセッションはすべてログアウトされる。なくしたパスキーは残るので、復旧の後に、管理画面のパスキーの一覧から消す。

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

## 本番の形で試す

本番の置き場所はまだ決めていない。ここにあるのは、手元の Mac で、本番と同じ形(ビルドした管理画面を server が外部用のポートで配り、公開サイト Amayadori のサーバーが内部用のポートの公開 API を呼ぶ)を試す手順。開発用の PostgreSQL(`postgres`)とは別のコンテナの PostgreSQL を使い、データはコンテナを消すと消える。Amayadori は、このリポジトリの隣(`../amayadori`)に checkout しておく。

| ポート | 中身                                                                 |
| ------ | -------------------------------------------------------------------- |
| 55442  | 試し用の PostgreSQL(`127.0.0.1` だけ)                                |
| 18787  | server の外部用のポート(管理画面と管理用 API)                        |
| 18788  | server の内部用のポート(公開 API とデプロイ用 API。`127.0.0.1` だけ) |
| 13000  | Amayadori(`127.0.0.1` だけ)                                          |

1. 環境変数のファイルなどを置くフォルダを、リポジトリの外に作る。

   ```bash
   mkdir -p ~/analemma-trial
   ```

   シェルに同じ名前の環境変数があると、`--env-file` のファイルより優先され、別の DB に migration を流しうる。次のコマンドが何も出さないことを確かめる(出たら `unset` する)。

   ```bash
   env | grep -E '^(DATABASE_URL|AUTH_ORIGIN|AUTH_RP_ID|PORT|INTERNAL_PORT|INTERNAL_HOST|ADMIN_DIST_DIR|MEDIA_DIR|ANALEMMA_INTERNAL_URL|ANALEMMA_URL|HOST)='
   ```

2. PostgreSQL を起動する。migration は superuser でないロールで適用するので、DB の持ち主のロールを最初に作る。

   ```bash
   printf '%s\n' "CREATE ROLE analemma LOGIN PASSWORD 'analemma-trial';" "CREATE DATABASE analemma OWNER analemma;" > ~/analemma-trial/create-app-role.sql
   ```

   ```bash
   docker run -d --name analemma-trial-postgres -e POSTGRES_PASSWORD=postgres -p 127.0.0.1:55442:5432 --tmpfs /var/lib/postgresql -v ~/analemma-trial/create-app-role.sql:/docker-entrypoint-initdb.d/create-app-role.sql:ro postgres:18.7-trixie
   ```

3. server の環境変数を `~/analemma-trial/analemma.env` に書く。`ADMIN_DIST_DIR` は、このリポジトリの `apps/admin/dist` の絶対パスにする。`MEDIA_DIR`(配信用の画像の置き場所)は、ホームの絶対パスにする。パスキーは `127.0.0.1` では使えないので、`AUTH_ORIGIN` は `localhost` にする。

   ```bash
   mkdir -p ~/analemma-trial/media
   ```

   ```text
   DATABASE_URL=postgres://analemma:analemma-trial@127.0.0.1:55442/analemma
   AUTH_ORIGIN=http://localhost:18787
   AUTH_RP_ID=localhost
   PORT=18787
   INTERNAL_PORT=18788
   ADMIN_DIST_DIR=/path/to/analemma/apps/admin/dist
   MEDIA_DIR=/path/to/home/analemma-trial/media
   ```

4. 管理画面をビルドし、migration を適用して、server を起動する(起動したままにする)。

   ```bash
   bun --cwd=apps/admin run build
   ```

   ```bash
   bun --cwd=apps/server --env-file="$HOME/analemma-trial/analemma.env" run db:migrate
   ```

   ```bash
   bun --cwd=apps/server --env-file="$HOME/analemma-trial/analemma.env" run start
   ```

5. 別のターミナルで登録用 URL を出し、ブラウザで開いてパスキーを登録する。登録すると、管理画面 `http://localhost:18787` にログインした状態になる。開くのは、開発の管理画面(`http://localhost:5173`)にログインしていないブラウザ(別のプロファイルなど)にする。Cookie はポートを区別しないので、同じブラウザでは試し用の Cookie が開発用の Cookie を上書きし、その後に開発の管理画面を操作すると、どちらのセッションも消える。

   ```bash
   bun --cwd=apps/server --env-file="$HOME/analemma-trial/analemma.env" run passkey:enroll
   ```

6. 管理画面の「デプロイ用のトークン」で、デプロイ用のトークンを発行し、token を写す。
7. Amayadori の環境変数を `~/analemma-trial/amayadori.env` に書く。

   ```text
   ANALEMMA_INTERNAL_URL=http://127.0.0.1:18788
   PORT=13000
   HOST=127.0.0.1
   ```

8. Amayadori のフォルダで、client をビルドして依存を入れ、Amayadori をビルドし、種類の定義を送ってから起動する。token は、シェルの履歴に残さないよう `read` で受け、`kinds:push` にだけ渡す(export しない。起動したサーバーに渡さないため)。`kinds:push` の終了コードが 0 でなければ、起動しない。

   ```bash
   bun --cwd=../analemma/packages/client run build && bun install
   ```

   ```bash
   bun --env-file="$HOME/analemma-trial/amayadori.env" run build
   ```

   ```bash
   read -rs ANALEMMA_DEPLOY_TOKEN
   ```

   ```bash
   ANALEMMA_DEPLOY_TOKEN="$ANALEMMA_DEPLOY_TOKEN" bun --env-file="$HOME/analemma-trial/amayadori.env" run kinds:push && unset ANALEMMA_DEPLOY_TOKEN
   ```

   ```bash
   bun --env-file="$HOME/analemma-trial/amayadori.env" run start
   ```

9. 管理画面の「固定ページ」で、送った種類のページを作って公開する。`http://127.0.0.1:13000` の一覧に出て、開くとページが描かれる。
10. 試し終えたら、server と Amayadori を止め(Ctrl-C)、PostgreSQL のコンテナを消す。

    ```bash
    docker rm -f analemma-trial-postgres
    ```
