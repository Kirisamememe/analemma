# @analemma/admin

Stilus(管理画面)。React の SPA(TanStack Router + TanStack Query)。

- Vite でビルドし、本番では `apps/server` が同じ origin で配信する。SSR はしない。
- ブラウザで動くコードだけを持つ。データはすべて server の API から取る。
