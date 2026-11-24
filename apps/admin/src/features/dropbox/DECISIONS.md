# 決めたことと理由(管理画面の dropbox の feature)

Dropbox の App folder に置いた写真を取り込む画面(`/images/dropbox`)と、Dropbox の認可の画面から戻る画面(`/images/dropbox/callback`)。server の決めごとは `apps/server/src/features/dropbox/DECISIONS.md` にある。

## 画面

- 1つの画面に、接続の欄と、App folder の写真の一覧を置き、主の操作は「新しい写真を N 枚取り込む」の1つにする。App folder は取り込みたい写真を置く場所なので、置いた写真をまとめて取り込むのが普通の使い方になる。写真を選んで取り込む案(タブとチェック)と比べて決めた(案は、ノートの mockup)。server は写真の ID を選んで受けるので、選ぶ操作が要れば後から足せる。
- 取り込みの途中は、同じ一覧の行に写真ごとの状態を出し、見出しの下に進み具合の文を出す。行は、アップロードの画面と共通の部品(`src/components/photo-progress/`)にする。
- 入口は、画像の一覧の見出しの「Dropbox から取り込む」のリンク。
- Dropbox から戻る画面では、「つなぐ」を押してから code を送る。開いただけで送るには effect が要るが、管理画面の決まりでは、操作がきっかけの処理は event handler で書く(`apps/admin/DECISIONS.md` の「React の effect」)。つないだら、取り込みの画面へ履歴を置き換えて移り、code を履歴に残さない。
- Dropbox の認可の画面へは、`window.location.assign` で移る(別のタブを開かない)。戻る先は同じタブの管理画面なので。

## 描き直しを抑える作り

- 進み具合は、取り込みの途中だけ1秒ごとに読み直す(`useApiPolling`)。読み直しを持つ部品は描き直さない。
- 一覧の部品は写真の ID の並びだけを持ち、写真1枚の行は、一覧の取得と進み具合の取得から、自分の1枚だけを `useApiData` で読む。進み具合が変わっても、状態の変わった写真の行だけが描き直される(`hooks/__tests__/use-dropbox-photo-row.test.tsx` が Profiler の onRender の回数で確かめる)。
- 状態の移り変わり(一覧と進み具合を合わせた行・取り込める写真・数)は `logic/` の純粋な関数に置き、hook はつなぐだけにする。

## 割り切ったこと

- **一覧の古さ**:取り込みを終えても、App folder の写真の一覧(取り込んだ記録)は読み直さない。行は進み具合の状態で上書きするので、表示は合う。画面を開き直すか「読み直す」を押せば、記録も新しくなる。
