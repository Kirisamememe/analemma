/** 写真の変換を、プロセスの中で1つずつ順に流すキュー。 */
export type ConversionQueue = {
  /** 変換をキューに並べ、その結果を返す。 */
  readonly run: <T>(convert: () => Promise<T>) => Promise<T>;
};

/** 写真の変換を1つずつ順に流すキューを作る。 */
export const createConversionQueue = (): ConversionQueue => {
  const waiting: (() => void)[] = [];
  let running = false;

  const startNext = (): void => {
    const start = waiting.shift();

    running = start !== undefined;
    start?.();
  };

  return {
    run: async <T>(convert: () => Promise<T>): Promise<T> => {
      const { promise, resolve } = Promise.withResolvers<T>();

      waiting.push(() => {
        const converted = Promise.resolve().then(convert);

        resolve(converted);
        void Promise.allSettled([converted]).then(startNext);
      });

      if (!running) startNext();

      return promise;
    },
  };
};
