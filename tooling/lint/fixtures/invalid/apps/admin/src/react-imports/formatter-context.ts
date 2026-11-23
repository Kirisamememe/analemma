import { createElement } from "react";

/** 題を描いた結果。 */
export type Rendered = ReturnType<typeof createElement>;

createElement("p");
