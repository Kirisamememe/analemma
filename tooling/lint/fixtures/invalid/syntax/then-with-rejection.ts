/** 値を読む。 */
export const readValue = async (
  read: () => Promise<number>,
): Promise<number | undefined> =>
  read().then(
    (value) => value,
    () => undefined,
  );
