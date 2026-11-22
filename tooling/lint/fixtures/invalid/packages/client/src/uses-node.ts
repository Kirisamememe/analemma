import { readFileSync } from "node:fs";

/** 設定の文字列。 */
export const config = readFileSync("config.json", "utf8");
