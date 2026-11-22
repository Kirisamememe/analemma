# @analemma/contract

API の contract(入出力の zod スキーマと型)。

- server が実装し、client が型として使う。client は、種類の定義と中身の検査のスキーマ(値)も使う。
- 特定の実行環境(Bun・Node・ブラウザ)に依存しない。どのワークスペースも import しない。
