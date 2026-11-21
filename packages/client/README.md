# @analemma/client

公開サイトが使う、型付きの SDK。npm で公開する(公開の手順は、ライセンスと一緒に決める)。

- `@analemma/contract` にだけ依存し、server のコードを含まない。公開サイトが server の内部を import できないことを、パッケージの依存で保証する。
- Bun・Node・ブラウザのどれでも動く。

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

項目の型は `text`・`longText`・`number`・`boolean`・`date`・`url`・`select`・`group`・`repeat`。項目は既定で必須で、`optional(...)` で省けるようにする。項目には、これらの関数で作ったものだけを使える(zod のスキーマを直接渡したり、`.min()` などで絞ったりすると、CMS が同じ検査をできないので、`defineKind` が失敗する)。

## 公開しているページを読む

CMS の内部用のポートに、公開サイトのサーバーから呼ぶ。

```ts
import { createAnalemmaClient } from "@analemma/client";

const cms = createAnalemmaClient({ url: "http://127.0.0.1:8788" });
const page = await cms.fixedPages.get(about, "about");
```

公開していないページと、無いページは、どちらも `undefined` になる。
