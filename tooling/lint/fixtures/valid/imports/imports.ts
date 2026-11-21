import { readFileSync, type Dirent } from "node:fs";

import "./side-effect";

/** 値 import を参照したままにする。 */
export const marker: typeof readFileSync = readFileSync;

/** フォルダの中の1件。 */
export type Entry = Dirent;
