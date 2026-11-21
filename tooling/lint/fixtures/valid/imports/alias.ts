/** このファイルの関数はこれだけ。 */
const only = (): number => 1;

export { only, only as also };

/** 型の export に個数制限はない。 */
export type Alias = typeof only;
