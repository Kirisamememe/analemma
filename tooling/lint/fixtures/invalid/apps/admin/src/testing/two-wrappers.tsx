import type { ReactNode } from "react";

type WrapperProps = Record<"children", ReactNode>;

/** テストに渡す包みを作る関数を、1つのファイルに並べた補助。 */
export const withSection = () => {
  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <section>{children}</section>
  );

  return Wrapper;
};

/** もう1つの包みを作る関数。 */
export const withArticle = () => {
  const Wrapper = ({ children }: WrapperProps): ReactNode => (
    <article>{children}</article>
  );

  return Wrapper;
};
