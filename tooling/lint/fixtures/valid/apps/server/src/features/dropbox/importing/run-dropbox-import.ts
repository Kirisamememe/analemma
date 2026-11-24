/** 写真ごとの処理を流し、失敗した写真の数を返す。 */
export const runEach = async (
  steps: readonly (() => Promise<void>)[],
): Promise<number> => {
  let failed = 0;

  for (const step of steps) {
    try {
      // oxlint-disable-next-line eslint/no-await-in-loop -- 1つずつ流す
      await step();
    } catch {
      failed += 1;
    }
  }

  return failed;
};
