/** 16 バイトの AAGUID を、UUID の形の文字列にする。 */
export const formatAaguid = (aaguid: Uint8Array): string => {
  const hex = aaguid.toHex();

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
};
