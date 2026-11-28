import type { ReactNode } from "react";

/** 部品を組むだけの場所で、5段まで入れ子にした部品。 */
export const FiveDeep = ({ children }: Record<"children", ReactNode>) => (
  <section>
    <ul>
      <li>
        <p>
          <b>
            <i>{children}</i>
          </b>
        </p>
      </li>
    </ul>
  </section>
);
