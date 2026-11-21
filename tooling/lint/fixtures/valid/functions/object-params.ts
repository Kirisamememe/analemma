type JoinInput = {
  /** 1つ目の数。 */
  a: number;
  /** 2つ目の数。 */
  b: number;
  /** 3つ目の数。 */
  c: number;
};

/**
 * 3つの値を1つのオブジェクトで受け取る。
 */
export const join = ({ a, b, c }: JoinInput): number => a + b + c;
