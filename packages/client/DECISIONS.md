# 決めたことと理由(client)

## 種類の定義(`kinds/`)

- 種類の原本は公開サイトのコードで、`defineKind` で定義する。型は TypeScript が定義から推論し、型を書き出すコマンドは作らない(ユーザーと決めた)。
- 項目は zod のスキーマにする。項目の関数(`text` など)が、contract の値のスキーマ(`content-values.ts`)を写し、項目の定義を `WeakMap` に結びつける。`defineKind` は、項目の並びをそのまま `z.object` に渡して、中身のスキーマにする。
  - 中身の型は、zod の推論から得る。定義の JSON から型を計算する型を別に書くと、型と検査が別々の場所にあることになり、両者が合っていることを型検査で確かめられない(最後にキャストが要る)。
  - 項目の関数で作っていないスキーマ(素の zod や、`.min()` などで絞ったもの)は、`defineKind` で失敗させる。公開サイトだけにある検査を、CMS は知らずに保存してしまうため。
- `defineKind` は、作った定義を contract の `kindDefinition` で検査する。CMS が断る名前や入れ子を、デプロイを待たずに、定義を読み込んだ時点で知らせる。
- 公開サイトの中身のスキーマと、CMS が定義の JSON から作るスキーマ(contract の `toContentSchema`)が、同じ値を同じように扱うことを、テストで確かめる。
- 項目の順は、`fields` のオブジェクトに書いた順にする。CMS には配列で送る(jsonb がキーの順を保たないため。server の kinds の `DECISIONS.md`)。

## 公開 API の client(`fixed-pages/`)

- 中身は、受け取った後に、渡された種類の中身のスキーマで検査してから返す。検査しなければ、推論した型を付けるのにキャストが要る。CMS は保存のときに検査しているので、ここで失敗するのは、公開サイトの定義が CMS に送った定義と食い違うとき(送り忘れなど)だけで、そのときは失敗として投げる。
- 無いページは `undefined` を返す。公開していないページと区別しない(server の約束のまま)。CMS の想定外の失敗は投げる。
- oRPC の client(RPC のプロトコル)で呼ぶ。contract の型をそのまま使え、OpenAPI の handler を server に足さずに済む。

## TypeScript の設定

- `tsconfig.json` はテストを含めて Bun の型を足す。`tsconfig.src.json` は、テストを除いた SDK を、Web 標準の型(fetch・URL など。TypeScript では `DOM` の lib にある)だけで検査する。Bun と Node の型を使うコードが SDK に入ると、ここで落ちる。ブラウザだけの API(`window` など)は、型付きの lint が `tsconfig.json`(`DOM` の lib を持たない)で読むので、error 型として止まる。

## 割り切ったこと

まだ無い。
