# 決めたことと理由(受けた写真の処理)

受けた写真から、EXIF の撮影の情報を読む(`read-shot-info.ts`)。写真を読むライブラリは使わず、`src/platform/images/` の処理に、読む tag を渡す。

## 撮影の情報

- 読むのは、撮影日時(DateTimeOriginal)・時差(OffsetTimeOriginal)・カメラ(Make・Model)・レンズ(LensMake・LensModel)・焦点距離・絞り・シャッター速度・ISO(ISOSpeedRatings と、上限を超えたときに感度を書く SensitivityType・StandardOutputSensitivity・RecommendedExposureIndex・ISOSpeed)の tag だけ。GPS の tag は挙げない(ユーザーと決めた)。ExifReader は挙げていない tag の値を decode しないので、GPS は読みもしない。
- 値が無いプロパティは省く(`undefined` も入れない)。DB の列で null にするのは、行を作る側。

### 値の形

- 撮影日時は、EXIF の `YYYY:MM:DD HH:MM:SS` を、時差を含まない ISO 8601 の形(`2025-05-01T14:03:27`)にする。暦に無い日時(0 の月や日、2月29日の無い年、24時)と、形の違うものは返さない。時計を合わせていないカメラが書く `0000:00:00 00:00:00` や空白を、撮影日時として持たないため。暦に合うかは Temporal の `PlainDateTime` に任せる。`overflow` を `reject` にすると throw し、try/catch は入口の外で書けないので、`constrain` で丸めた結果が元と違えば、暦に無いと見なす。
- 時差は、OffsetTimeOriginal が `±HH:MM` の形で、±18時間以内のときだけ、分の整数にする。撮影日時が無ければ返さない。DB の check の制約が、時差だけがある行と、±18時間を超える時差を断るため。`-00:00` は 0 にする。
- カメラとレンズは、メーカーと機種を1つの文字列にする。機種がメーカーの最初の語で始まるとき(`Canon` と `Canon EOS R5`、`NIKON CORPORATION` と `NIKON Z 6_2`)は機種だけにし、ほかはメーカーと機種を空白でつなぐ(`SONY ILCE-7M4`)。機種だけでは分からないカメラ(`ILCE-7M4`)と、つなぐだけでは名前が重なるカメラ(`Canon Canon EOS R5`)があるため。前後の空白と NUL を除き、空になれば無いと見なす。
- 焦点距離(mm)・絞り(F 値)・シャッター速度(秒)は、分数を割った数にする。0 以下の値と、分母が 0 の値は返さない。ISO は、正の整数のときだけ返す。値が複数あれば、最初の値を使う。
- ISOSpeedRatings が上限の 65535 なら、SensitivityType が指す tag から感度を読む。複数の tag を指す場合は同じ感度を表すため、どれか1つに正の整数があればその値を使う。どの tag にも値が無ければ 65535 を返す。Exif の規格では、65535 を超える感度(ISO 102400 など)は ISOSpeedRatings に 65535 と書き、本当の値を SensitivityType が指す tag に書くため。

## 割り切ったこと

まだ無い。
