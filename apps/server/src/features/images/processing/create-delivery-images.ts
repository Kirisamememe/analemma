import {
  type ImageFormat,
  detectImageFormat,
} from "@/platform/images/detect-image-format";
import { type AvifImage, encodeAvif } from "@/platform/images/encode-avif";
import { type IccProfile, shrinkImage } from "@/platform/images/shrink-image";

const ACCEPTED_FORMATS: ReadonlySet<ImageFormat> = new Set([
  "jpeg",
  "png",
  "webp",
  "avif",
  "heic",
]);

const LONGEST_EDGE = 2560;
const SMALLER_WIDTHS = [1920, 1280, 640];
const AVIF_QUALITY = 50; // 理由は DECISIONS.md の「画質」
const ICC_PROFILE: IccProfile = "p3";

/** 配信用の画像を作れたこと。 */
type Created = {
  /** どの結果か。 */
  readonly _tag: "Created";
  /** 幅の大きい順に並べた、配信用の画像。 */
  readonly images: readonly AvifImage[];
};

/** 受けない形式の bytes だったこと。 */
type UnsupportedFormat = {
  /** どの結果か。 */
  readonly _tag: "UnsupportedFormat";
};

/** 配信用の画像を作った結果。 */
export type DeliveryImagesResult = Created | UnsupportedFormat;

/** 一番大きい段の幅から、作る段の幅を決める。 */
export const chooseWidths = (largestWidth: number): readonly number[] => [
  largestWidth,
  ...SMALLER_WIDTHS.filter((width) => width < largestWidth),
];

/** 受けた写真の bytes から、配信用の画像(AVIF)を幅の段ごとに作る。 */
export const createDeliveryImages = async (
  bytes: Uint8Array,
): Promise<DeliveryImagesResult> => {
  const format = await detectImageFormat(bytes);

  if (format === undefined || !ACCEPTED_FORMATS.has(format)) {
    return { _tag: "UnsupportedFormat" };
  }

  const largest = await shrinkImage(bytes, {
    format,
    longestEdge: LONGEST_EDGE,
    iccProfile: ICC_PROFILE,
  });

  const images: AvifImage[] = [];

  for (const width of chooseWidths(largest.width)) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- 1段ずつ順に作り、メモリの山を1段の分に抑える
    const image = await encodeAvif(largest.png, {
      width,
      quality: AVIF_QUALITY,
    });

    images.push(image);
  }

  return { _tag: "Created", images };
};
