# @analemma/admin

Stilus(管理画面)。React の SPA(TanStack Router + TanStack Query)。

- Vite でビルドし、本番では `apps/server` が同じ origin で配信する。SSR はしない。
- ブラウザで動くコードだけを持つ。データはすべて server の API から取る。
- 画面の文言は `en`・`ja`・`zh-Hans` に訳す。
- 見た目は、公開サイトと共通のデザインシステム(`src/ui/theme.css`)で作る。
