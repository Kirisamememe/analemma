import type { ReactNode } from "react";
import { Button as AriaButton, ProgressBar } from "react-aria-components";

import type { PendingState } from "@/ui/primitives/button";
import { Icon, type IconName, Spinner } from "@/ui/primitives/graphics";
import { navItem } from "@/ui/primitives/navigation/nav-item-style";
import { typography } from "@/ui/typography";

/** ナビのボタンに渡す値。 */
type NavButtonProps = PendingState & {
  /** ボタンの文言。 */
  children: ReactNode;
  /** ボタンに添えるアイコン。 */
  icon: IconName;
  /** 押したときに呼ぶ関数。 */
  onPress?: () => void;
};

/** ナビに置く操作のボタン。 */
export const NavButton = ({
  children,
  icon,
  isPending = false,
  pendingLabel,
  onPress,
}: NavButtonProps): ReactNode => {
  const shownPendingLabel = isPending ? pendingLabel : undefined;

  return (
    <AriaButton
      className={navItem({
        className: typography({
          role: "body",
          className: "is-pending:cursor-wait",
        }),
      })}
      isPending={isPending}
      onPress={() => onPress?.()}
    >
      <Icon name={icon} />
      <span className="min-w-0 truncate">{children}</span>
      {shownPendingLabel !== undefined && (
        <ProgressBar
          aria-label={shownPendingLabel}
          className="ml-auto shrink-0"
          isIndeterminate
        >
          <Spinner />
        </ProgressBar>
      )}
    </AriaButton>
  );
};
