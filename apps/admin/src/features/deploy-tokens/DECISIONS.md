# 決めたことと理由(管理画面の deploy-tokens の feature)

画面は `/deploy-tokens`(デプロイ用のトークン)。一覧と、発行・取り消しの操作を置く。server の決まりは `apps/server/src/features/deploy-tokens/DECISIONS.md` にある。

## 発行

- 発行の前に再認証をする(server の決まり)。再認証をキャンセルしたら、発行を送らない。
- 名前は、再認証の前に、contract と同じスキーマ(`deployTokenName`)で確かめ、入力欄に誤りを出す。送ってから server に名前を断られると、本人確認の OS の画面を済ませた後に、想定外の失敗として知らせることになる。
- token は、発行した Dialog の state にだけ置き、TanStack Query(query と送信の cache)に入れない。送信の結果に token を入れると、Dialog を閉じても、送信の cache が消えるまで(既定で5分)query client から読める。送信の結果は、どの結果か(`_tag`)だけにする。一覧は server が token を返さず、URL にも載せない。閉じた後に、画面・URL・query client のどこからも token を読めないことを、画面のテストで確かめる。
- 発行できたら、同じ Dialog を、token を見せる中身に替え、Toast で発行したことを知らせる。Dialog を閉じると、token はもう出せない。
- token は等幅の字体で、1回の選択で全体を選べるように出す(`ui/token-value.tsx`)。コピーのボタンは Clipboard API で書き、書けなければ(許可が無いなど)、手でコピーするよう知らせる。中身を替えたら、コピーのボタンに focus を移す。押したボタンが消え、focus の行き先が無くなるため。
- 一覧は、発行できたときだけ取り直す。断られた発行は、一覧を変えない。

## 取り消し

- 取り消しには再認証を求めない(server の決まり)。取り消せないので、トークンの名前を出した確認の Dialog の後に送る。
- 取り消しの結果は、もう無いトークン(`NOT_FOUND`)でも一覧を取り直す。Dialog と一覧の focus の扱いは、パスキーの欄と同じ(`apps/admin/DECISIONS.md` の「パスキーとセッションの管理」)。行が消えたら、欄の最初の要素(トークンの発行のボタン)に focus を移す。

## 作り物の server

- `src/testing/fake-routes/create-deploy-token-routes.ts` は、セッションの確認と再認証の options も自分で持つ。パスキーの作り物とは別に、この画面のテストと story だけで使う。1つの再認証で1回だけ発行でき、無いトークンの取り消しは `NOT_FOUND` を返す。

## 割り切ったこと

- **閉じた後の Dialog の state**:発行した Dialog を閉じても、次に発行の Dialog を開くか画面を離れるまで、token は Dialog の state(メモリ)に残る。閉じるときに消すと、閉じる animation の間に中身が名前の入力に戻って跳ぶ。DOM と query client には残らず、読めるのは開発者ツールで React の state を見る人だけで、その人はすでに管理者のセッションを持つ。
