/** 待ち受ける2つのポートの番号(`0` は OS に選ばせる)。 */
export type ListenPorts = {
  /** 外部用のポートの番号。 */
  readonly external: number;
  /** 内部用のポートの番号。 */
  readonly internal: number;
};

/** 2つのポートのうち、先に待ち受けるポートを選ぶ。 */
export const chooseFirstListener = ({
  external,
  internal,
}: ListenPorts): "external" | "internal" =>
  internal === 0 && external !== 0 ? "external" : "internal";
