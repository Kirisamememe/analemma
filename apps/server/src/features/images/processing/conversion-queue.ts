/** 写真の変換を、プロセスの中で1つずつ順に流すキュー。 */
export type ConversionQueue = {
  /** 変換をキューに並べ、その結果を返す。 */
  readonly run: <T>(
    convert: () => Promise<T>,
    signal?: AbortSignal,
  ) => Promise<T>;
};

const whenAborted = (signal: AbortSignal): Promise<never> => {
  const { promise, reject } = Promise.withResolvers<never>();

  const abort = (): void => {
    reject(new DOMException("写真の変換を待つのをやめた", "AbortError"));
  };

  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });

  return promise;
};

/** 写真の変換を1つずつ順に流すキューを作る。 */
export const createConversionQueue = (): ConversionQueue => {
  let previous: Promise<unknown> = Promise.resolve();

  return {
    run: async (convert, signal) => {
      const result = previous.then(async () =>
        signal?.aborted === true ? whenAborted(signal) : convert(),
      );

      previous = Promise.allSettled([result]);

      return signal === undefined
        ? result
        : Promise.race([result, whenAborted(signal)]);
    },
  };
};
