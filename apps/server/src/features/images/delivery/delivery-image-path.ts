/** 配信用の画像を配る path を作る。 */
export const toDeliveryImagePath = (imageId: string, width: number): string =>
  `/media/${imageId}/${width}.avif`;
