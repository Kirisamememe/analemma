import { Fragment, type ReactNode } from "react";

import type { Dependencies } from "./dependencies";

/** feature の部品の形。 */
export type Feature = (dependencies: Dependencies) => ReactNode;

/** セキュリティの見出し。 */
export const Heading = (): ReactNode => (
  <Fragment>
    <h1>セキュリティ</h1>
    <p>登録したパスキー</p>
  </Fragment>
);
