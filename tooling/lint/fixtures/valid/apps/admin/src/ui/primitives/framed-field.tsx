/** 入力を受ける部品の枠は、primitives の中で line-strong で描ける。 */
export const FramedField = () => (
  <span className="rounded-control border border-line-strong bg-surface is-invalid:border-danger" />
);
