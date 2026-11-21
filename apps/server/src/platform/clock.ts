/** 現在時刻の出どころ。 */
export type Clock = {
  /** 現在時刻。 */
  readonly now: () => Date;
};

/** 実行環境の時計を読む Clock。 */
export const systemClock: Clock = {
  /** 実行環境の現在時刻。 */
  now: () => new Date(),
};
