/** 写真の変換を、プロセスの中で1つずつ順に流すキュー。 */
export type ConversionQueue = {
  /** 変換をキューに並べ、その結果を返す。 */
  readonly run: <T>(convert: () => Promise<T>) => Promise<T>;
};

/** 写真の変換を1つずつ順に流すキューを作る。 */
export const createConversionQueue = (): ConversionQueue => {
  let previous: Promise<unknown> = Promise.resolve();

  return {
    run: (convert) => {
      const result = previous.then(convert);

      previous = Promise.allSettled([result]);

      return result;
    },
  };
};
