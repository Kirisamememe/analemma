type Hidden = {
  /** 識別子。 */
  readonly id: string;
};

/** 非公開の型を参照したままにする。 */
export const marker: Hidden = { id: "hidden" };
