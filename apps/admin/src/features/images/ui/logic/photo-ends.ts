/** 幅の昇順に並んだ配信用の画像の、最小と最大。 */
type PhotoEnds<Photo> = {
  /** 最小の画像。 */
  readonly smallest: Photo;
  /** 最大の画像。 */
  readonly largest: Photo;
};

/** 幅の昇順に並んだ配信用の画像から、最小と最大を返す。 */
export const photoEnds = <Photo>(
  images: readonly Photo[],
): PhotoEnds<Photo> | undefined => {
  const smallest = images[0];
  const largest = images.at(-1);

  return smallest === undefined || largest === undefined
    ? undefined
    : { smallest, largest };
};
