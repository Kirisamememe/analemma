# 決めたことと理由(画像の処理の platform)

写真を読む外のライブラリを使うコードは、このフォルダにだけ置く(ユーザーと決めた)。どの tag を読むか、GPS を読むかといった決めごとは、使う feature(`src/features/images/processing/`)の側に置き、ここには、渡された指定のとおりに動く処理だけを置く。

## platform に置く理由

- 画像の feature の直接アップロードと、Dropbox からの取り込み(別の feature にする)の両方が使う。
- feature の lint には、外のライブラリを使う例外を作らない(ユーザーが決めた)。外のライブラリは platform で使い、feature はここの関数を呼ぶ。

## Exif

- ExifReader の composable API(`exifreader/core`)で、呼ぶ側が名前を挙げた tag だけを組み込んだ reader を作る(ユーザーと決めた)。ExifReader は、組み込んでいない tag の値を decode せずに飛ばすので、GPS の tag を挙げなければ、GPS の IFD があっても緯度や経度を読まない。sharp の `metadata().exif` を解く exif-reader は GPS を読んでから捨てるしかなく、exifr は WebP と AVIF を読めず、撮影日時をプロセスの時刻帯で `Date` にする。
- tag の名前から ExifReader の tag の定義を引くために、`exifreader/tags/exif` の export を名前の Map にする。名前は `ExifTagName` の型で、ExifReader が読める tag に限る。
- 値は ExifReader の `computed` を返す。分数は割った数(分母が 0 なら null)、文字列は文字列のまま。どの形式でも同じ reader で読めるよう、形式は ExifReader が読めるものを全部組み込む。受ける形式を決めるのは、呼ぶ側。

## テストの見本

- 撮った写真や個人のファイルを入れない(リポジトリは公開する)。JPEG・PNG・WebP・AVIF の見本は、テストの中で sharp で作り、`withExif` で EXIF と GPS を書く。
- HEIC の見本は、sharp では書けない(prebuilt に HEVC の encoder が無い)ので、合成したファイル `__tests__/rotated-with-gps.heic`(2KB)をコミットする。青の 96×64 の左上の 48×32 を赤にした JPEG を sharp で作り、EXIF(撮影日時 `2025:05:01 14:03:27`・時差 `+09:00`・`Apple` の `iPhone 15 Pro`・焦点距離 6.765・F1.78・1/120 秒・ISO 80・レンズ)と GPS と Orientation 6 を書いてから、macOS の `sips -s format heic` で変えた。iPhone の HEIC と同じく、表示の向き(64×96)に回す指定と、EXIF の Orientation 6 の両方を持つ。画像の feature のテストも、この見本を読む。
- `__tests__` にテストのファイルだけを置く決まり(lint の `test-location`)は、コードのファイルを対象にする。画像の見本は、使うテストと同じ `__tests__` に置く。

## 割り切ったこと

まだ無い。
