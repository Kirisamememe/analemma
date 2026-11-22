import { readFile } from "node:fs/promises";

/** 管理画面の本番のコードで、Node の API のサブパスを読む。 */
export const readTheme = async (): Promise<string> =>
  readFile("theme.css", "utf8");
