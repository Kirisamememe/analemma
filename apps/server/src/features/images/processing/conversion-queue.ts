/** 写真の変換を、プロセスの中で1つずつ順に流すキュー。 */
export type ConversionQueue = {
  /** 変換をキューに並べ、その結果を返す。 */
  readonly run: <T>(
    convert: () => Promise<T>,
    signal?: AbortSignal,
  ) => Promise<T>;
};

const abortError = (): DOMException =>
  new DOMException("写真の変換を待つのをやめた", "AbortError");

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
    run: async <T>(
      convert: () => Promise<T>,
      signal?: AbortSignal,
    ): Promise<T> => {
      if (signal?.aborted === true) throw abortError();

      const { promise, resolve, reject } = Promise.withResolvers<T>();

      const abort = (): void => {
        const index = waiting.indexOf(start);

        if (index < 0) return;

        waiting.splice(index, 1);
        reject(abortError());
      };

      const start = (): void => {
        signal?.removeEventListener("abort", abort);

        const converted = Promise.resolve().then(convert);

        resolve(converted);
        void Promise.allSettled([converted]).then(startNext);
      };

      signal?.addEventListener("abort", abort, { once: true });
      waiting.push(start);

      if (!running) startNext();

      return promise;
    },
  };
};
