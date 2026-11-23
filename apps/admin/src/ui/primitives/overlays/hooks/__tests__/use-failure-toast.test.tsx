import { act, cleanup, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { createI18n } from "@/i18n/create-i18n";
import { withI18n } from "@/testing/render-with-i18n";
import { useFailureToast } from "@/ui/primitives/overlays/hooks/use-failure-toast";
import { ToastProvider } from "@/ui/primitives/overlays/toast";

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

describe("useFailureToast", () => {
  test("失敗を出し直すと、前に出した失敗の Toast を閉じて、新しい失敗だけを残す", () => {
    const { result } = renderHook(useFailureToast, { wrapper: withToast });

    act(() => {
      result.current.show("送れませんでした。");
    });
    act(() => {
      result.current.show("もう一度送れませんでした。");
    });

    expect(
      screen.getAllByRole("alert").map((toast) => toast.textContent),
    ).toEqual(["もう一度送れませんでした。"]);
  });

  test("閉じる関数で、出した失敗の Toast を閉じる", () => {
    const { result } = renderHook(useFailureToast, { wrapper: withToast });

    act(() => {
      result.current.show("送れませんでした。");
    });
    act(() => {
      result.current.close();
    });

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
