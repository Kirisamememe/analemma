import type { ReactNode } from "react";

/** 共通の部品の場所で、6段まで入れ子にした部品。 */
export const SixDeep = ({ children }: Record<"children", ReactNode>) => (
  <section>
    <ul>
      <li>
        <p>
          <b>
            <i>
              <u>{children}</u>
            </i>
          </b>
        </p>
      </li>
    </ul>
  </section>
);
