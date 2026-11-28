import type { ComponentProps } from "react";
import type { Link } from "react-aria-components";

/** アプリが React Aria Components に登録した型で書く、リンクの行き先。 */
export type Href = NonNullable<ComponentProps<typeof Link>["href"]>;
