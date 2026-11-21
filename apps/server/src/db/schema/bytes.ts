import { customType } from "drizzle-orm/pg-core";

/** `Uint8Array` で読み書きする bytea の列。 */
export const bytes = customType<{
  /** アプリで読み書きする値。 */
  data: Uint8Array<ArrayBuffer>;
  /** postgres.js とやり取りする値。 */
  driverData: Uint8Array;
}>({
  dataType: () => "bytea",
  fromDriver: (value) => new Uint8Array(value),
});
