import type { ReactNode } from "react";

import type { Dependencies } from "./dependencies";

/** feature の部品の形。 */
export type Feature = (dependencies: Dependencies) => ReactNode;

/** 見出しに渡す値。 */
type HeadingProps = {
  /** 見出しの文言。 */
  readonly title: string;
  /** 見出しの下の説明。 */
  readonly lead: string;
};

/** セキュリティの見出し。 */
export const Heading = ({ title, lead }: HeadingProps): ReactNode => (
  <>
    <h1>{title}</h1>
    <p>{lead}</p>
  </>
);
