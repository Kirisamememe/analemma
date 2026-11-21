/** 値を読む。 */
export const readValue = async (
  read: () => Promise<number>,
): Promise<number | undefined> => {
  try {
    return await read();
  } catch {
    return undefined;
  }
};

/** 値を読む。 */
export const readQuietly = async (
  read: () => Promise<number>,
): Promise<number | undefined> => read().catch(() => undefined);
