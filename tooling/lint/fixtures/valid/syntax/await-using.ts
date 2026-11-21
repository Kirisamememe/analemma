/** 持っているあいだだけ有効な lock。 */
type Lock = AsyncDisposable;

const acquireLock = (): Promise<Lock> =>
  Promise.resolve({ [Symbol.asyncDispose]: () => Promise.resolve() });

/** lock を持ったまま、渡した処理を流す。 */
export const withLock = async (work: () => Promise<void>): Promise<void> => {
  await using lock = await acquireLock();
  await work();
};
