/** 変換を流し、失敗を書き残す。 */
export const runConversion = async (
  convert: () => Promise<void>,
  fail: () => Promise<void>,
): Promise<void> => {
  try {
    await convert();
  } catch {
    await fail();
  }
};
