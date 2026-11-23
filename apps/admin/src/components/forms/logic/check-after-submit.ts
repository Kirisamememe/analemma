/** 入力欄の validator が受け取る値のうち、`checkAfterSubmit` が読むもの。 */
type ValidatorProps<Value> = {
  /** 入力欄の値。 */
  readonly value: Value;
  /** 入力欄と、それを持つフォーム。 */
  readonly fieldApi: {
    /** 入力欄を持つフォーム。 */
    readonly form: {
      /** フォームの状態。 */
      readonly state: {
        /** 送ろうとした回数。 */
        readonly submissionAttempts: number;
      };
    };
  };
};

/** 送った後にだけ値を確かめる、入力欄の validator を作る。 */
export const checkAfterSubmit =
  <Value>(check: (value: Value) => string | undefined) =>
  ({ value, fieldApi }: ValidatorProps<Value>): string | undefined =>
    fieldApi.form.state.submissionAttempts > 0 ? check(value) : undefined;
