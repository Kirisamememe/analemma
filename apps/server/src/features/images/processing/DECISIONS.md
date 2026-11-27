# 決めたことと理由(受けた写真の処理)

受けた写真から、EXIF の撮影の情報を読み(`read-shot-info.ts`)、配信用の画像を作る(`create-delivery-images.ts`)。写真を読み書きするライブラリは使わず、`src/platform/images/` の処理に、読む tag や作る幅を渡す。

## 撮影の情報

- 読むのは、撮影日時(DateTimeOriginal)・時差(OffsetTimeOriginal)・カメラ(Make・Model)・レンズ(LensMake・LensModel)・焦点距離・絞り・シャッター速度・ISO(ISOSpeedRatings と、上限を超えたときに感度を書く SensitivityType・StandardOutputSensitivity・RecommendedExposureIndex・ISOSpeed)の tag だけ。GPS の tag は挙げない(ユーザーと決めた)。ExifReader は挙げていない tag の値を decode しないので、GPS は読みもしない。
- 値が無いプロパティは省く(`undefined` も入れない)。DB の列で null にするのは、行を作る側。

### 値の形

- 撮影日時は、EXIF の `YYYY:MM:DD HH:MM:SS` を、時差を含まない ISO 8601 の形(`2025-05-01T14:03:27`)にする。暦に無い日時(0 の月や日、2月29日の無い年、24時)と、形の違うものは返さない。時計を合わせていないカメラが書く `0000:00:00 00:00:00` や空白を、撮影日時として持たないため。暦に合うかは Temporal の `PlainDateTime` に任せる。`overflow` を `reject` にすると throw し、try/catch は入口の外で書けないので、`constrain` で丸めた結果が元と違えば、暦に無いと見なす。
- 時差は、OffsetTimeOriginal が `±HH:MM` の形で、±18時間以内のときだけ、分の整数にする。撮影日時が無ければ返さない。DB の check の制約が、時差だけがある行と、±18時間を超える時差を断るため。`-00:00` は 0 にする。
- カメラとレンズは、メーカーと機種を1つの文字列にする。機種がメーカーの最初の語で始まるとき(`Canon` と `Canon EOS R5`、`NIKON CORPORATION` と `NIKON Z 6_2`)は機種だけにし、ほかはメーカーと機種を空白でつなぐ(`SONY ILCE-7M4`)。機種だけでは分からないカメラ(`ILCE-7M4`)と、つなぐだけでは名前が重なるカメラ(`Canon Canon EOS R5`)があるため。前後の空白と NUL を除き、空になれば無いと見なす。
- 焦点距離(mm)・絞り(F 値)・シャッター速度(秒)は、分数を割った数にする。0 以下の値と、分母が 0 の値は返さない。ISO は、正の整数のときだけ返す。値が複数あれば、最初の値を使う。
- ISOSpeedRatings が上限の 65535 なら、SensitivityType が指す tag から感度を読む。複数の tag を指す場合は同じ感度を表すため、どれか1つに正の整数があればその値を使う。どの tag にも値が無ければ 65535 を返す。Exif の規格では、65535 を超える感度(ISO 102400 など)は ISOSpeedRatings に 65535 と書き、本当の値を SensitivityType が指す tag に書くため。

## 配信用の画像

- CMS は原本を持たない。配信用の画像を作ったら、原本は捨てる(ユーザーと決めた)。直接アップロードの原本は、変換の順番が来るまで置き場所に置く(`../DECISIONS.md` の「直接アップロード」)。`createDeliveryImages` は、受けた bytes から、AVIF の bytes とその幅と高さを返すところまでを受け持つ。保存と置き場所は、画像を作る経路の側で決める。
- 受ける形式は JPEG・PNG・WebP・静止画の AVIF・HEIC(ユーザーと決めた)。ほかの形式と、形式を識別できない入力は `UnsupportedFormat` で返す。sharp が読める形式でも、写真に要らない処理(SVG を描くなど)を通さないため。
- 表示の向きに合わせ、長辺を 2560px までに縮めた PNG を作る(元より大きくしない)。この PNG から、その幅と、1920・1280・640px のうちそれより狭い幅の AVIF を作る(ユーザーと決めた最大4段)。公開サイトの `srcset` の `w` に合わせ、段を幅でそろえる。たとえば 4000×6000px の写真は 1707・1280・640px の3段になる。
- 段は1つずつ順に作り、`Promise.all` で並べない。並べると、段の数だけ AVIF の encoder が同時にメモリを持つ。lint の `no-await-in-loop` は、この1か所だけ抑制する。
- 写真ごとの変換も、プロセスの中で1つずつ流す(`conversion-queue.ts`)。受け取った写真や取り込みが重なっても、変換のメモリの山を1枚の分に抑える。キューに並べるのは、画像を作る経路の側(`creating/create-image.ts`・`creating/convert-pending-image.ts`)。
- 色は P3 に変換し、P3 の ICC を付ける(ユーザーと決めた)。iPhone の写真の P3 の色を保ち、sRGB の写真は P3 の中に収まるので、見た目は変わらない。
- EXIF・GPS・XMP は、配信用の画像に残さない(ユーザーと決めた)。

### 画質

- AVIF の quality は 50(sharp の既定)、effort は既定の 4 にする。事前に時間とメモリを測ったのがこの値(6000×4000 の JPEG から4段で 3.2 秒、プロセスの山が 566MB。Mac M1 Max)で、NAS では1枚ずつ順に流す前提のメモリに収まるかが先に効くため。NAS の実機と iPhone の実ファイルで、時間・メモリ・見た目を測って見直す。

## 割り切ったこと

- **読めない bytes**:対応する形式の署名を持ち、中身が壊れていて読めない写真は、decoder が throw するので、想定外の失敗になる。Dropbox からの取り込みは、その写真を失敗として進み具合に書く。直接アップロードは、リクエストの外で変換するので、画像を変換失敗にしてログに書く(`../DECISIONS.md` の「直接アップロード」)。sharp には throw せずに確かめる API が無く、try/catch は入口の外で書けない。壊れたファイルを受けることはまれで、データも壊れないので、想定内の失敗にはしない。
