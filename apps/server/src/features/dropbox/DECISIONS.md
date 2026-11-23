# 決めたことと理由(dropbox の feature)

利用者が Dropbox の App folder に置いた写真を、まとめて画像にする(ユーザーと決めた)。CMS は原本を持たず、取り込んだ写真から配信用の画像だけを作る。

## つなぐ

- Dropbox のアプリは、利用者が App Console で App folder の権限で作り、app key と app secret を server の環境変数(`DROPBOX_APP_KEY`・`DROPBOX_APP_SECRET`)に書く。両方が無ければ、接続の状態は `unconfigured` になり、server は起動する。Dropbox を使わない置き方もあるため。片方だけのときと、英数字のほかを含むときは、起動しない。
- 認可は、app secret を使う code flow(`token_access_type=offline`)にし、PKCE は使わない。Dropbox で PKCE を使うには、App Console で「Allow public clients」を有効にする必要がある。有効にすると、公開されている app key だけで認可を始められ、PKCE で得た refresh token は app secret なしで更新できる。secret を使う code flow なら、refresh token の更新に app secret が要るので、DB だけが漏れても token は使えない。code の差し込みは、セッションに結んだ1回きりの state・完全に一致する redirect URI・同じ origin の管理用 API で防ぐ。
- 求める範囲は、読むだけの `account_info.read`・`files.metadata.read`・`files.content.read`。
- redirect URI は、`AUTH_ORIGIN` に管理画面の path(contract の `DROPBOX_REDIRECT_PATH`)を付けたもの。セッションの Cookie は `SameSite=Strict` で、Dropbox から戻る遷移には付かないので、server の route では受けない。管理画面の画面で code と state を受け、同じ origin の `admin.dropbox.connect` に送る。
- state は、プロセスのメモリに、認可を始めたセッションの ID と一緒に、10分だけ1回きりで覚える(パスキーの challenge と同じく、1プロセスが前提)。知らない state・別のセッションの state・期限を過ぎた state・使った state は、どれも `AUTHORIZATION_EXPIRED` にする。
- refresh token は DB に平文で置き、access token は DB に置かず、使う間だけメモリに持つ。暗号化はしない。鍵を app secret から作ると、refresh にもともと要る secret と同じものに頼るので、守りが増えない。別の鍵を置くと、鍵を失ったときの再接続と、鍵を替える手順が増える。DB の backup の守りは、本番の置き場所と一緒に決める。
- つなぐのは1つのアカウントだけ(行を1つに限る)。つないでいる間は認可を始めず(`ALREADY_CONNECTED`)、別のアカウントにつなぐときは、切ってからにする。管理画面に、どのアカウントにつないだかを出すため、アカウントの表示名とメールアドレスを持つ。
- 切るときは、Dropbox に取り消しを送ってから行を消す。Dropbox が取り消しを断ったら、warn のログを書いて、行は消す(利用者は Dropbox の設定からも切れる)。
- 利用者が Dropbox の設定でアプリを切ったときや、app secret を作り直したときは、refresh token の更新が断られる。そのときは行を消して `CONNECTION_LOST` を返し、管理画面に、つなぎ直す操作を出させる。切るときも同じで、行を消して終える。

## 割り切ったこと

- **再起動をまたいだ認可**:state をプロセスのメモリに持つので、認可の画面を開いている間に server を再起動すると、戻ったときに `AUTHORIZATION_EXPIRED` になる。管理画面から認可をやり直せば済むので、state を DB に置かない。
