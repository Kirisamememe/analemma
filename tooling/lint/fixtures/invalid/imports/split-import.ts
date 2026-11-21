import { readFileSync } from "node:fs";
import type { Dirent } from "node:fs";

/** 値 import を参照したままにする。 */
export const marker: typeof readFileSync = readFileSync;

/** ディレクトリエントリ。 */
export type Entry = Dirent;
