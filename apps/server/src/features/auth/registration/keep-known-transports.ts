const KNOWN_TRANSPORTS = new Set([
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

/** 認証器が申告した transports から、仕様にある値だけを重ねずに残す。 */
export const keepKnownTransports = (
  transports: readonly string[],
): string[] => [
  ...new Set(transports.filter((transport) => KNOWN_TRANSPORTS.has(transport))),
];
