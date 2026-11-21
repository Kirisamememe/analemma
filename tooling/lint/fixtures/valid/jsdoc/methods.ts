/** メソッドをメソッドのまま残すクラス。 */
export class Box {
  /** 保持している大きさ。 */
  readonly size = 1;

  /** 大きさを返す。 */
  method(): number {
    return this.size;
  }

  /** getter 経由で大きさを返す。 */
  get value(): number {
    return this.size;
  }
}

/** オブジェクトのメソッド構文は許可する。 */
export const bag = {
  /** 公開するオブジェクトのメソッドにも JSDoc が要る（eslint-plugin-jsdoc 65 から）。 */
  method(): number {
    return 1;
  },
};
