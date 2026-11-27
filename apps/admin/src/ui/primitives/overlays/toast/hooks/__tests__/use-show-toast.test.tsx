import { act, cleanup, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { createI18n } from "@/i18n/create-i18n";
import { withI18n } from "@/testing/render-with-i18n";
import { useShowToast } from "@/ui/primitives/overlays/toast/hooks/use-show-toast";
import { ToastProvider } from "@/ui/primitives/overlays/toast/toast";

type WrapperProps = {
  /** 描く部品。 */
  children: ReactNode;
};

const I18n = withI18n(createI18n("ja"));

const withToast = ({ children }: WrapperProps): ReactNode => (
  <I18n>
    <ToastProvider>{children}</ToastProvider>
  </I18n>
);

afterEach(cleanup);

describe("useShowToast", () => {
  test("ToastProvider の中では、渡した知らせを Toast に出す関数を返す", () => {
    const { result } = renderHook(useShowToast, { wrapper: withToast });

    act(() => {
      result.current({ tone: "success", message: "保存しました。" });
    });

    expect(screen.getByRole("alert").textContent).toBe("保存しました。");
  });

  test("ToastProvider の外で呼ぶと、ToastProvider の中で呼ぶように伝えて throw する", () => {
    expect(() => renderHook(useShowToast)).toThrow(
      "useShowToast は ToastProvider の中で呼んでください。",
    );
  });
});
