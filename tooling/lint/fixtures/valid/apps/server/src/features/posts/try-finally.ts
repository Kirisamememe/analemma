/** 値を読み、読み終えたら閉じる。 */
export const readThenClose = async (
  read: () => Promise<number>,
  close: () => void,
): Promise<number> => {
  try {
    return await read();
  } finally {
    close();
  }
};
