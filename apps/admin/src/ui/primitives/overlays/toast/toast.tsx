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

import { Icon } from "@/ui/primitives/graphics";
import {
  ShowToastContext,
  type ToastMessage,
} from "@/ui/primitives/overlays/toast/toast-context";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const toastStyle = tv({
  slots: {
    region: [
      "fixed inset-x-4 top-toast z-toast mx-auto max-w-sm",
      "flex flex-col gap-2",
      "rounded-surface outline-hidden is-focus-shown:focus-ring",
    ],
    toast:
      "rounded-surface shadow-overlay toast-animation is-focus-shown:focus-ring",
    panel: "flex items-start gap-2 rounded-surface py-2 ps-4 pe-2",
    content: "flex min-w-0 flex-1 items-start gap-2 py-1.5",
    iconFrame: "flex h-5 shrink-0 items-center",
    message: "min-w-0 wrap-anywhere",
    close: [
      "inline-flex size-8 shrink-0 items-center justify-center",
      "rounded-control border border-transparent outline-hidden transition",
      "is-hovered:state-hover is-focus-shown:focus-ring-current is-pressed:state-pressed",
    ],
  },
  variants: {
    tone: {
      success: {
        panel: "bg-surface scheme-inverse text-fg",
        iconFrame: "text-success",
      },
      danger: { panel: "bg-danger-strong text-on-danger-strong" },
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
  children: ReactNode;
};

/** Toast の queue と region を持つ Provider。 */
export const ToastProvider = ({ children }: ToastProviderProps): ReactNode => {
  const { t } = useTranslation();
  const [queue] = useState(createQueue);

  const showToast = useCallback(
    (message: ToastMessage) => {
      const key = queue.add(
        message,
        message.tone === "success" ? { timeout: 5000 } : undefined,
      );

      return () => {
        queue.close(key);
      };
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

          return (
            <AriaToast className={slots.toast()} toast={toast}>
              <div className={slots.panel()}>
                <AriaToastContent className={slots.content()}>
                  <span className={slots.iconFrame()}>
                    <Icon
                      name={
                        tone === "success" ? "circle-check" : "circle-alert"
                      }
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
                  <Icon name="x" />
                </AriaButton>
              </div>
            </AriaToast>
          );
        }}
      </AriaToastRegion>
    </ShowToastContext>
  );
};
