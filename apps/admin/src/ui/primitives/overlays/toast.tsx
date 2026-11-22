import { CircleAlert, CircleCheck, X } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import {
  Button as AriaButton,
  Text as AriaText,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";

import { tv } from "../../tv";
import { typography } from "../../typography";
import { ShowToastContext, type ToastMessage } from "./toast-context";

const toastStyle = tv({
  slots: {
    region:
      "fixed inset-s-4 inset-e-4 bottom-4 z-toast ms-auto flex max-w-sm flex-col-reverse gap-2",
    panel:
      "flex items-start gap-2 rounded-surface bg-surface py-2 ps-4 pe-2 text-fg shadow-overlay outline outline-fg/10 toast-animation is-focus-shown:focus-ring",
    content: "flex min-w-0 flex-1 items-start gap-2 py-1.5",
    iconFrame: "flex h-5 shrink-0 items-center",
    icon: "size-icon",
    message: "min-w-0 wrap-anywhere",
    close:
      "inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-transparent text-fg outline-hidden transition-colors is-hovered:state-hover is-focus-shown:focus-ring is-pressed:state-pressed",
  },
  variants: {
    tone: {
      success: { icon: "text-success" },
      danger: { icon: "text-danger" },
    },
  },
});

const createQueue = (): AriaToastQueue<ToastMessage> => {
  const pendingUpdates: (() => void)[] = [];

  return new AriaToastQueue({
    wrapUpdate: (update) => {
      pendingUpdates.push(update);

      if (pendingUpdates.length > 1) {
        return;
      }

      document.startViewTransition({
        types: ["toast"],
        update: () => {
          const updates = pendingUpdates.splice(0);

          flushSync(() => {
            for (const applyUpdate of updates) {
              applyUpdate();
            }
          });
        },
      });
    },
  });
};

type ToastProviderProps = {
  /** 管理画面の中身。 */
  readonly children: ReactNode;
};

/** Toast の queue と region を持つ Provider。 */
export const ToastProvider = ({ children }: ToastProviderProps): ReactNode => {
  const { t } = useTranslation();
  const [queue] = useState(createQueue);
  const showToast = useCallback(
    (message: ToastMessage) => {
      queue.add(
        message,
        message.tone === "success" ? { timeout: 5000 } : undefined,
      );
    },
    [queue],
  );
  const { region } = toastStyle();

  return (
    <ShowToastContext value={showToast}>
      {children}
      <AriaToastRegion className={region()} queue={queue}>
        {({ toast }) => {
          const { tone, message } = toast.content;
          const slots = toastStyle({ tone });
          const Icon = tone === "success" ? CircleCheck : CircleAlert;

          return (
            <AriaToast className={slots.panel()} toast={toast}>
              <AriaToastContent className={slots.content()}>
                <span className={slots.iconFrame()}>
                  <Icon
                    aria-hidden="true"
                    className={slots.icon()}
                    strokeWidth={1.75}
                  />
                </span>
                <AriaText
                  className={slots.message({
                    className: typography({ role: "body" }),
                  })}
                  slot="title"
                >
                  {message}
                </AriaText>
              </AriaToastContent>
              <AriaButton
                aria-label={t("ui.close")}
                className={slots.close()}
                slot="close"
              >
                <X
                  aria-hidden="true"
                  className="size-icon"
                  strokeWidth={1.75}
                />
              </AriaButton>
            </AriaToast>
          );
        }}
      </AriaToastRegion>
    </ShowToastContext>
  );
};
