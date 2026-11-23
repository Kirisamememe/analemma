# 決めたことと理由(画像の処理の platform)

写真を読む外のライブラリを使うコードは、このフォルダにだけ置く(ユーザーと決めた)。どの tag を読むか、GPS を読むかといった決めごとは、使う feature(`src/features/images/processing/`)の側に置き、ここには、渡された指定のとおりに動く処理だけを置く。

## platform に置く理由

- 画像の feature の直接アップロードと、Dropbox からの取り込み(別の feature にする)の両方が使う。
- 実行環境を替えたときに直す場所だから。sharp は OS と CPU ごとの native の binary を持ち、HEIC と、ICC の無い AVIF は OS に入れるコマンド(`heif-dec`・`ffmpeg`)で読む。
- feature の lint には、外のライブラリを使う例外を作らない(ユーザーが決めた)。外のライブラリは platform で使い、feature はここの関数を呼ぶ。

## Exif

- ExifReader の composable API(`exifreader/core`)で、呼ぶ側が名前を挙げた tag だけを組み込んだ reader を作る(ユーザーと決めた)。ExifReader は、組み込んでいない tag の値を decode せずに飛ばすので、GPS の tag を挙げなければ、GPS の IFD があっても緯度や経度を読まない。sharp の `metadata().exif` を解く exif-reader は GPS を読んでから捨てるしかなく、exifr は WebP と AVIF を読めず、撮影日時をプロセスの時刻帯で `Date` にする。
- tag の名前から ExifReader の tag の定義を引くために、`exifreader/tags/exif` の export を名前の Map にする。名前は `ExifTagName` の型で、ExifReader が読める tag に限る。
- 値は ExifReader の `computed` を返す。分数は割った数(分母が 0 なら null)、文字列は文字列のまま。どの形式でも同じ reader で読めるよう、形式は ExifReader が読めるものを全部組み込む。受ける形式を決めるのは、呼ぶ側。

## 形式

- JPEG・PNG・WebP は先頭の署名で見分ける。静止画の AVIF は `ftyp` の major brand か compatible brand にある `avif` で判定する。major brand が `mif1` の場合、sharp が AVIF を HEVC と判定するため。残りの HEIF の候補は sharp の `metadata().compression` を確認する。AVIF のシーケンスを示す brand（avis）があれば、写真としては受け付けない。対応しない形式は画像として開かずに呼ぶ側へ返す。

## ICC の無い AVIF

- FFmpeg の `ffprobe` で AVIF の primary image の色域と伝達特性を読み、`ffmpeg` の `scale` で Display P3 の色域と sRGB の伝達特性に変換する。sharp は nclx を入力の ICC として扱わない。FFmpeg の出力は16-bit RGB の PNG にする。sharp はこの形式の画素を P3 として読み、配信用の ICC を付けられる。ICC がある AVIF は埋め込み ICC を優先する。
- 元の画素は sharp で透明度を含めて PNG に展開してから FFmpeg に渡す。FFmpeg 8 の libdav1d は、行列係数が identity の Display P3 の AVIF で RGB の画素を YUV と解釈するため。タイルの合成も sharp に任せる。色に alpha を乗算済みの画像は `heif-info` で primary image の指定を確認し、sharp の `composite` で乗算前の RGB に戻す。

## HEIC

- sharp の prebuilt は HEVC を decode できない。OS の libheif のコマンド `heif-dec` を子プロセスで呼び、PNG の一時ファイルにしてから sharp に渡す(ユーザーと決めた)。wasm の libheif は、decode の後もプロセスに約550MB が残り、ICC が落ちる(iPhone の P3 の色がくすむ)ので使わない。
- PNG は `--png-compression-level 1` で書く。既定の水準より速い(24MP で 7.5 秒が 3.0 秒)。TIFF は速いが ICC が落ち、stdout には書けない。heif-dec は PNG に EXIF を書かない。
- 一時ファイルは、OS の一時フォルダに `mkdtempDisposable` で作ったフォルダに置き、`AsyncDisposableStack` と `await using` で消す。heif-dec は PNG を書けなくても正常終了することがある。書き込みのエラーと出力ファイルの有無も確かめ、失敗したときはフォルダを消してから throw する。PNG は、sharp に渡すまでメモリに読まず、パスで渡す。
- 子プロセスには、引数を配列で渡し、shell を通さない(`execFile`)。渡すパスは、作ったフォルダの中の決まった名前だけ。
- Mac(Homebrew の libheif)、Alpine(`libheif-tools`)、CI の Ubuntu 26.04(`libheif-examples` 1.21)のどれでも `heif-dec` の名前で入る。1.18 より前の libheif では `heif-convert` という名前だった。
- CI では、workflow が `libheif-examples` と `libheif-plugin-libde265` を `--no-install-recommends` で入れる。plugin を書かないと、HEVC の decoder が入らない。

## テストの見本

- 撮った写真や個人のファイルを入れない(リポジトリは公開する)。EXIF の検査では JPEG・PNG・WebP・AVIF をテストの中で sharp で作り、`withExif` で EXIF と GPS を書く。
- AVIF の色の見本は libavif の `avifenc --lossless --ignore-icc --cicp` を使い、赤の画素に Display P3 は `12/13/0`、sRGB は `1/13/0` を指定した。Display P3 の alpha は 50% にした。`--premultiply` を指定したものと、左が半透明の赤、右が不透明の青の2タイルも用意した。
- HEIC の見本は、sharp では書けない(prebuilt に HEVC の encoder が無い)ので、合成したファイル `__tests__/rotated-with-gps.heic`(2KB)をコミットする。青の 96×64 の左上の 48×32 を赤にした JPEG を sharp で作り、EXIF(撮影日時 `2025:05:01 14:03:27`・時差 `+09:00`・`Apple` の `iPhone 15 Pro`・焦点距離 6.765・F1.78・1/120 秒・ISO 80・レンズ)と GPS と Orientation 6 を書いてから、macOS の `sips -s format heic` で変えた。iPhone の HEIC と同じく、表示の向き(64×96)に回す指定と、EXIF の Orientation 6 の両方を持つ。画像の feature のテストも、この見本を読む。
- `__tests__` にテストのファイルだけを置く決まり(lint の `test-location`)は、コードのファイルを対象にする。画像の見本は、使うテストと同じ `__tests__` に置く。

## 割り切ったこと

- **画像を2つ以上持つ HEIC**:top-level の画像を2つ以上持つ HEIC は、heif-dec が番号付きの名前で書き出すので、変換に失敗する(想定外の失敗)。iPhone の写真は、1つの画像に深度などの補助の画像を付ける形で、補助の画像は書き出さない。iPhone の実ファイルでは、まだ確かめていない。
