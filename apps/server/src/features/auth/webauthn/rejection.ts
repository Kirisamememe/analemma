/** パスキーの応答を受け付けなかったことと、その理由。 */
export type WebAuthnRejection = {
  /** 結果の種類。 */
  readonly _tag: "Rejected";
  /** 受け付けなかった理由。 */
  readonly problem: string;
};

/** 仕様の手順の1つを満たしたこと。 */
export type WebAuthnPassed = {
  /** 結果の種類。 */
  readonly _tag: "Passed";
};

/** 仕様の手順の1つを満たしたことを表す値。 */
export const PASSED: WebAuthnPassed = { _tag: "Passed" };

/** 理由を添えて、応答を受け付けなかったことを表す値を作る。 */
export const reject = (problem: string): WebAuthnRejection => ({
  _tag: "Rejected",
  problem,
});
