/** 扱う COSE のアルゴリズムの番号。 */
export const COSE_ALGORITHM = {
  EdDSA: -8,
  ES256: -7,
  RS256: -257,
} as const;

/** 扱う COSE のアルゴリズムの番号のどれか。 */
export type CoseAlgorithm =
  (typeof COSE_ALGORITHM)[keyof typeof COSE_ALGORITHM];

const ALGORITHMS = new Set<unknown>(Object.values(COSE_ALGORITHM));

/** 値が、扱う COSE のアルゴリズムの番号かを返す。 */
export const isCoseAlgorithm = (value: unknown): value is CoseAlgorithm =>
  ALGORITHMS.has(value);
