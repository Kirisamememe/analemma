/** 1つ目の型。 */
export type First = {
  /** 識別子。 */
  readonly id: string;
};

/** 2つ目の型。 */
export type Second = {
  /** 表示名。 */
  readonly name: string;
};

/** 3つ目の型。 */
export type Third = {
  /** 成功したか。 */
  readonly ok: boolean;
};

/** 閉じたモードの集合。 */
export type Mode = "off" | "on";
