# 決めたことと理由(dropbox の feature)

利用者が Dropbox の App folder に置いた写真を、まとめて画像にする(ユーザーと決めた)。CMS は原本を持たず、取り込んだ写真から配信用の画像だけを作る。

## つなぐ

- Dropbox のアプリは、利用者が App Console で App folder の権限で作り、app key と app secret を server の環境変数(`DROPBOX_APP_KEY`・`DROPBOX_APP_SECRET`)に書く。両方が無ければ、接続の状態は `unconfigured` になり、server は起動する。Dropbox を使わない置き方もあるため。片方だけのときと、英数字のほかを含むときは、起動しない。
- 認可は、app secret を使う code flow(`token_access_type=offline`)にし、PKCE は使わない。Dropbox で PKCE を使うには、App Console で「Allow public clients」を有効にする必要がある。有効にすると、公開されている app key だけで認可を始められ、PKCE で得た refresh token は app secret なしで更新できる。secret を使う code flow なら、refresh token の更新に app secret が要るので、DB だけが漏れても token は使えない。code の差し込みは、セッションに結んだ1回きりの state・完全に一致する redirect URI・同じ origin の管理用 API で防ぐ。
- 求める範囲は、読むだけの `account_info.read`・`files.metadata.read`・`files.content.read`。
- redirect URI は、`AUTH_ORIGIN` に管理画面の path(contract の `DROPBOX_REDIRECT_PATH`)を付けたもの。セッションの Cookie は `SameSite=Strict` で、Dropbox から戻る遷移には付かないので、server の route では受けない。管理画面の画面で code と state を受け、同じ origin の `admin.dropbox.connect` に送る。
- state は、プロセスのメモリに、認可を始めたセッションの ID と一緒に、10分だけ1回きりで覚える(パスキーの challenge と同じく、1プロセスが前提)。知らない state・別のセッションの state・期限を過ぎた state・使った state は、どれも `AUTHORIZATION_EXPIRED` にする。
- refresh token は DB に平文で置き、access token は DB に置かず、使う間だけメモリに持つ。暗号化はしない。鍵を app secret から作ると、refresh にもともと要る secret と同じものに頼るので、守りが増えない。別の鍵を置くと、鍵を失ったときの再接続と、鍵を替える手順が増える。DB の backup の守りは、本番の置き場所と一緒に決める。
- code を token に換えた後で、アカウントを読めないときや、つないだ行を作れないときは、受け取った認可を Dropbox で取り消してから失敗にする。行の無い認可は、管理画面から取り消せないため。code の交換には、リクエストの `AbortSignal` を渡さない。管理者が待つのをやめても、発行された token を受け取り、取り消せるようにするため。
- つなぐのは1つのアカウントだけ(行を1つに限る)。つないでいる間は認可を始めず(`ALREADY_CONNECTED`)、別のアカウントにつなぐときは、切ってからにする。管理画面に、どのアカウントにつないだかを出すため、アカウントの表示名とメールアドレスを持つ。
- 切るときは、読んだ行の refresh token で Dropbox に取り消しを送ってから、その行を消す。後始末の取り消しには、リクエストの `AbortSignal` を渡さない。管理者が待つのをやめても、受け取った認可を Dropbox に残さないため。行は1回だけ読む。読み直すと、間につなぎ直した新しい接続の認可を取り消してしまう。Dropbox が取り消しを断ったら(5xx など)、行を残して想定外の失敗にし、管理者に切り直させる。取り消せていない認可を、取り消せたことにしないため。
- 利用者が Dropbox の設定でアプリを切ったときは、refresh token の更新が断られる(`invalid_grant`)。切るときにそうなれば、取り消すものが無いので、行だけを消して終える。
- app key と app secret を外した server でも、接続の行があれば、切らずに `NOT_CONFIGURED` を返す。取り消しを送れないまま行を消すと、設定を戻した後に、管理画面から認可を取り消せなくなるため。

## 取り込む写真

- App folder の下のフォルダまで、すべてのファイルを読み、拡張子が JPEG・PNG・WebP・AVIF・HEIC・HEIF のものを、Dropbox で最後に変わった順に返す。形式は画像を作るときに中身で見分けるので、拡張子は一覧を絞るためだけに使う。
- 取り込み済みかは、Dropbox の content_hash で見分ける。ファイルの ID は、同じ名前で置き直すと変わり、中身を書き換えても変わらないので、同じ写真かの判断に使えない。content_hash なら、別の名前の複製も、置き直した同じ写真も、取り込み済みと分かり、現像し直して中身が変わった写真は、新しい写真として取り込める。
- 取り込んだ記録は `dropbox_import` に持つ(content_hash が主キーで、ファイルの ID・パス・作った画像・日時)。画像を消しても記録は残し(画像の列を null にする)、同じ写真を取り込み直さない。要らない写真を消した後で、まとめて取り込んだときに戻ってこないようにするため。消した写真を戻すときは、直接アップロードで送る。

## 割り切ったこと

- **別の Dropbox のアプリに替えた後の切断**:つないだまま、app key と app secret を別のアプリのものに替えて切ると、refresh token の更新が断られ(`invalid_grant`)、元のアプリの認可を取り消さずに行を消す。元のアプリの認可は、Dropbox の設定の「接続済みのアプリ」から外せる。アプリを替えるのは置き場所を作り直すときくらいなので、行に app key を持って見分ける仕組みは作らない。

- **つなぐ途中で、取り消しまで失敗したとき**:code を token に換えた後で、アカウントの読み取りと、後始末の取り消しが続けて失敗すると(Dropbox の障害が重なったとき)、つなぐのは失敗し、Dropbox に読むだけの認可が1つ残る。管理画面からは取り消せないが、Dropbox の設定の「接続済みのアプリ」から外せる。取り消しをやり直すには、行の無い認可を覚えておく仕組みが要るので、作らない。
- **行の確定の応答を失ったとき**:接続の行を書いた直後に DB との通信が切れると、行は残るのに、つなぐのは失敗し、後始末でその認可を取り消す。次に Dropbox を使うときに更新が断られ、行が消えるので、つなぎ直せば戻る。写真の登録のように、確定したかを確かめる仕組みは作らない。

- **再起動をまたいだ認可**:state をプロセスのメモリに持つので、認可の画面を開いている間に server を再起動すると、戻ったときに `AUTHORIZATION_EXPIRED` になる。管理画面から認可をやり直せば済むので、state を DB に置かない。
