/** 配信用の画像を配る path の、最初のフォルダ。 */
export const DELIVERY_IMAGE_PREFIX = "/media";

/** 配信用の画像を指す、画像の ID と幅。 */
export type DeliveryImageTarget = {
  /** 画像の ID。 */
  readonly imageId: string;
  /** 幅(px)。 */
  readonly width: number;
};

const DELIVERY_IMAGE_PATH =
  /^\/media\/(?<imageId>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(?<width>[1-9][0-9]{0,4})\.avif$/v;

/** 配信用の画像を配る path を作る。 */
export const toDeliveryImagePath = (imageId: string, width: number): string =>
  `${DELIVERY_IMAGE_PREFIX}/${imageId}/${width}.avif`;

/** 配信用の画像を配る path から、画像の ID と幅を読む。 */
export const parseDeliveryImagePath = (
  path: string,
): DeliveryImageTarget | undefined => {
  const groups = DELIVERY_IMAGE_PATH.exec(path)?.groups;
  const imageId = groups?.["imageId"];
  const width = groups?.["width"];

  return imageId === undefined || width === undefined
    ? undefined
    : { imageId, width: Number(width) };
};
