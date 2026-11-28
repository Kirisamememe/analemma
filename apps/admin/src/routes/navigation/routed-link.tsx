import type { ReactNode } from "react";

import { Link, type LinkProps } from "@/ui/primitives/navigation";

/** router が行き先を入れて渡す、リンクの値。 */
type RoutedLinkProps = Pick<LinkProps, "children" | "ref" | "variant"> & {
  /** router が route のパスと params から作った行き先。 */
  href?: string | undefined;
};

/** router が作った行き先を、部品のリンクに渡す。 */
export const RoutedLink = ({
  href = "",
  children,
  ref,
  variant = "inline",
}: RoutedLinkProps): ReactNode => (
  <Link href={href} ref={ref} variant={variant}>
    {children}
  </Link>
);
