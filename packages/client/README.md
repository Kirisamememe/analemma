# @analemma/client

公開サイトが使う、型付きの SDK と、種類の定義を送る CLI。npm で公開する(公開の手順は、ライセンスと一緒に決める)。

- `@analemma/contract` にだけ依存し、server のコードを含まない。公開サイトが server の内部を import できないことを、パッケージの依存で保証する。
- SDK は Bun・Node・ブラウザのどれでも動く(npm の形では、ビルドした JS を読む)。CLI(`analemma`)は Node で動かす。

## 種類を定義する

固定ページの種類は、公開サイトのコードで定義する。中身の型は、定義から推論される。

```ts
import {
  type KindContent,
  defineKind,
  longText,
  optional,
  repeat,
  text,
  url,
} from "@analemma/client";

export const about = defineKind({
  name: "about",
  label: "自己紹介",
  fields: {
    headline: text({ label: "見出し" }),
    bio: optional(longText({ label: "本文" })),
    links: repeat({
      label: "リンク",
      fields: { name: text({ label: "名前" }), url: url({ label: "URL" }) },
    }),
  },
});

export type AboutContent = KindContent<typeof about>;
```

項目の型は `text`・`longText`・`number`・`boolean`・`date`・`url`・`select`・`group`・`repeat`。項目は既定で必須で、`optional(...)` で省けるようにする。真偽値の項目は省けず、いつも値を持つ。`boolean({ label: "連絡先を出す", default: true })` のように既定値を書け(省くと `false`)、値の無いページは既定値として読む。3つ目の状態が要るなら `select` を使う。項目には、これらの関数で作ったものだけを使える(zod のスキーマを直接渡したり、`.min()` などで絞ったりすると、CMS が同じ検査をできないので、`defineKind` が失敗する)。

### 定義を変えるとき

- 項目を消すのは、いつでもよい。データは CMS に残り、古いサイトに戻しても使える。
- データの入っている項目の型を変えたり、使われている選択肢を消したりすると、CMS が断る。
- 真偽値の項目を足すと、そのキーが無いページでは既定値を使う。同じキーに真偽値が残っていればその値を使い、ほかの型の値が残っていれば定義を断る。
- ページのある種類に必須の項目を足すと、CMS が断る。デプロイを2回に分ける。1回目で `optional(...)` の項目として足し、管理画面で各ページにデータを入れてから、2回目で必須にする。

## 公開しているページを読む

公開サイトのサーバーから、CMS の内部用のポートの公開 API を呼ぶ。

```ts
import { createAnalemmaClient } from "@analemma/client";

const cms = createAnalemmaClient({ url: "http://127.0.0.1:8788" });
const page = await cms.fixedPages.get(about, "about");
```

公開していないページと、無いページは、どちらも `undefined` になる。slug の形(英小文字と数字の kebab-case、100文字まで)に合わない名前も、公開 API を呼ばずに `undefined` を返すので、URL の一部をそのまま渡し、`undefined` なら 404 にすればよい。

## 公開している画像とコレクションを読む

同じ client の `cms.images.get(id)` で画像を、`cms.collections.list()` でコレクションの一覧を、`cms.collections.get(slug)` でコレクションと並び順どおりの画像を取得する。1件の取得で見つからなければ `undefined` になる。画像の `deliveryImages` には、ブラウザで読める絶対 URL と幅・高さが幅の昇順で入る。

## 種類の定義を送る

本番のデプロイのときに、新しいサイトに切り替える前に流す。定義のファイルは、`defineKind` で作った種類の配列を default export する。

```bash
analemma push-kinds ./src/lib/kinds.ts --url http://127.0.0.1:8788
```

- `ANALEMMA_DEPLOY_TOKEN` に、管理画面で発行したデプロイ用のトークンを入れておく。デプロイの仕組み(CI の secret など)から渡し、コマンドラインに書かない(シェルの履歴に残る)。
- URL は、`--url` か環境変数 `ANALEMMA_URL` で渡す。
- CMS が断ると(既存のページが新しい定義に合わないときなど)、合わないページを標準エラーに書き、0 でない終了コードで終わる。その終了コードで、デプロイが止まる。
- 定義のファイルを TypeScript で書くときは、Node 22.18 以上で流す(型を取り除いて読み込む)。定義のファイルの import は、Node が読める形(パッケージ名か、拡張子付きの相対パス)にする。

## 開発

```bash
bun run build
```

`dist/` に、SDK(`index.js` と型)と CLI(`cli/main.js`)を書き出す。SDK の型が読む contract の型(`packages/contract/dist/types/`)も作り直す。開発の間は、公開サイトから、このフォルダをつないで使う。

npm から入れるのと同じ形で、公開サイトに入れて試すときは、`packages/contract` と `packages/client` で、それぞれ固める(`prepack` が build する)。

```bash
bun pm pack --destination <置き場所>
```

公開サイトでは、client の `.tgz` を依存に書き、contract の `.tgz` を、client が依存する `@analemma/contract` の代わりに入れる(npm にまだ無いため。Bun では `overrides` に書く)。
