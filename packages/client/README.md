# @analemma/client

公開サイトが使う、型付きの SDK。npm で公開する予定。

- `@analemma/contract` にだけ依存し、server のコードを含まない。公開サイトが server の内部を import できないことを、パッケージの依存で保証する。
- Bun・Node・ブラウザのどれでも動くようにする。
