# @analemma/server

Analemma の本体。Bun で動く。

- 公開 API(公開サイト向け)と管理用 API(Stilus 向け)を、oRPC で同じ流儀で提供する。contract は `@analemma/contract` にある。
- 本番では、Stilus(`apps/admin`)のビルド結果も同じプロセス・同じ origin で配信する。
- Bun 専用の API は platform(`src/platform/`)と `src/main.ts` だけで使い、それ以外は Web 標準(`Request` / `Response` / `fetch`)で書く。
