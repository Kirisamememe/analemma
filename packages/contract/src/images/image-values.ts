import { z } from "zod";

import { imageTagSummary } from "./image-tag-values";

/** 文字列に使える文字の決まりと、合わないときの文言。 */
type TextRule = {
  /** 使える文字だけからなる文字列に合う正規表現。 */
  readonly pattern: RegExp;
  /** 合わないときの文言。 */
  readonly error: string;
};

const SINGLE_LINE: TextRule = {
  pattern: /^\P{Cc}*$/v,
  error: "改行と制御文字は使えない",
};

const MULTI_LINE: TextRule = {
  pattern: /^[\P{Cc}\t\n\r]*$/v,
  error: "改行とタブを除く制御文字は使えない",
};

const isWellFormed = (value: string): boolean => value.isWellFormed();

const trimmedText = (max: number, { error, pattern }: TextRule) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(pattern, { error })
    .refine(isWellFormed, { error: "対になっていないサロゲートは使えない" });

/** 画像の ID。 */
export const imageId = z.uuid().describe("画像の ID。");

/** 1回の送信で送れる、写真のファイルの大きさの上限(bytes)。 */
export const PHOTO_MAX_BYTES = 64 * 1024 * 1024;

/** 管理画面から送る、写真のファイル。 */
export const photoFile = z
  .file()
  .min(1)
  .max(PHOTO_MAX_BYTES)
  .describe(
    "写真のファイル(JPEG・PNG・WebP・AVIF・HEIC)。形式は中身で見分ける。",
  );

/** 画像のタイトル。 */
export const imageTitle = trimmedText(200, SINGLE_LINE).describe(
  "画像のタイトル。",
);

/** 画像の説明。 */
export const imageDescription = trimmedText(5000, MULTI_LINE).describe(
  "画像の説明。",
);

/** 画像の alt。 */
export const imageAlt = trimmedText(1000, SINGLE_LINE).describe("画像の alt。");

/** 画像を幅の段ごとに変換した、配信用の画像。 */
export const deliveryImage = z.object({
  width: z.int().positive().describe("幅(px)。"),
  height: z.int().positive().describe("高さ(px)。"),
  url: z
    .string()
    .startsWith("/")
    .describe("配信する URL。管理画面と同じ origin の、/ で始まる path。"),
});

const imageDetails = z.object({
  id: imageId,
  title: imageTitle.nullable().describe("タイトル。無ければ null。"),
  description: imageDescription.nullable().describe("説明。無ければ null。"),
  alt: imageAlt.nullable().describe("alt。無ければ null。"),
  takenAt: z.iso
    .datetime({ local: true })
    .nullable()
    .describe("撮影した現地の日時(時差を含まない)。分からなければ null。"),
  takenAtOffset: z
    .string()
    .regex(/^[+\-]\d{2}:\d{2}$/v)
    .nullable()
    .describe("撮影した場所の、UTC からの時差(+09:00)。分からなければ null。"),
  camera: z.string().nullable().describe("カメラ。分からなければ null。"),
  lens: z.string().nullable().describe("レンズ。分からなければ null。"),
  focalLength: z
    .number()
    .nullable()
    .describe("焦点距離(mm)。分からなければ null。"),
  fNumber: z.number().nullable().describe("絞り(F 値)。分からなければ null。"),
  exposureTime: z
    .number()
    .nullable()
    .describe("シャッター速度(秒)。分からなければ null。"),
  iso: z.int().nullable().describe("ISO 感度。分からなければ null。"),
});

/** 公開サイトに返す画像。 */
export const publishedImage = imageDetails.extend({
  deliveryImages: z
    .array(
      deliveryImage.extend({
        url: z
          .url({ protocol: /^https?$/v })
          .describe("配信用の画像の絶対 URL。"),
      }),
    )
    .describe("配信用の画像。幅の昇順。まだ作っていなければ空。"),
});

/** 固定ページの画像の項目を公開サイトに返す形。 */
export const publishedImageValue = z.discriminatedUnion("available", [
  z.object({ available: z.literal(true), image: publishedImage }),
  z.object({ available: z.literal(false) }),
]);

/** 公開サイトが取得できたかを判別できる、画像の項目の値。 */
export type PublishedImageValue = z.output<typeof publishedImageValue>;

/** 画像の状態。 */
export const imageStatus = z
  .enum(["processing", "unreadable", "interrupted", "unpublished", "published"])
  .describe(
    "画像の状態。processing は変換中、unreadable は写真を読めずに変換できなかった、interrupted は server の都合で変換を終えられなかった、unpublished は非公開、published は公開。",
  );

/** 画像の状態の型。 */
export type ImageStatus = z.output<typeof imageStatus>;

/** 管理画面に返す画像。 */
export const adminImage = imageDetails.extend({
  tags: z
    .array(imageTagSummary)
    .describe("画像に付けたタグ。管理画面で決めた順。"),
  status: imageStatus,
  publishedAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("公開した日時。公開していなければ null。"),
  createdAt: z.iso.datetime({ offset: true }).describe("作った日時。"),
  updatedAt: z.iso
    .datetime({ offset: true })
    .describe("タイトル・説明・alt を最後に変えた日時。"),
  deliveryImages: z
    .array(deliveryImage)
    .describe("配信用の画像。幅の昇順。まだ作っていなければ空。"),
});
