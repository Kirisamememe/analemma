import { act, cleanup, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { createI18n } from "@/i18n/create-i18n";
import { withI18n } from "@/testing/render-with-i18n";
import { useFailureToast } from "@/ui/primitives/overlays/toast/hooks/use-failure-toast";
import { ToastProvider } from "@/ui/primitives/overlays/toast/toast";

type WrapperProps = {
  /** 描く部品。 */
  children: ReactNode;
};

const I18n = withI18n(createI18n("ja"));

const withToast = ({ children }: WrapperProps): ReactNode => (
  <I18n>
    <ToastProvider closeLabel="閉じる">{children}</ToastProvider>
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

  test("前の画像の失敗が遅れても、今の画像の失敗を残す", () => {
    const { result, rerender } = renderHook(
      (id: string) => useFailureToast(id),
      {
        initialProps: "A",
        wrapper: withToast,
      },
    );

    const first = result.current;
    rerender("B");
    act(() => {
      result.current.show("港の画像を非公開にできませんでした。");
      first.show("山の画像はもうありません。");
    });
    expect(
      screen.getByText("港の画像を非公開にできませんでした。"),
    ).toBeDefined();
    expect(screen.getByText("山の画像はもうありません。")).toBeDefined();
    act(() => {
      first.close();
    });
    expect(
      screen.getByText("港の画像を非公開にできませんでした。"),
    ).toBeDefined();
  });

  test("別の対象に移ってから戻っても、前にその対象で出した失敗の Toast を閉じられる", () => {
    const { result, rerender } = renderHook(
      (id: string) => useFailureToast(id),
      { initialProps: "A", wrapper: withToast },
    );

    act(() => {
      result.current.show("山の画像を公開できませんでした。");
    });
    rerender("B");
    act(() => {
      result.current.show("港の画像を公開できませんでした。");
    });
    rerender("A");
    act(() => {
      result.current.close();
    });

    expect(
      screen.getAllByRole("alert").map((toast) => toast.textContent),
    ).toEqual(["港の画像を公開できませんでした。"]);
  });

  test("対象の id が替わっても、描き直しを増やさない", () => {
    let renders = 0;

    const { rerender } = renderHook(
      (id: string) => {
        renders += 1;
        return useFailureToast(id);
      },
      { initialProps: "A", wrapper: withToast },
    );

    rerender("B");
    expect(renders).toBe(2);
  });

  test("同じ対象のうちは、描き直しても同じ関数を返す", () => {
    const { result, rerender } = renderHook(
      (id: string) => useFailureToast(id),
      { initialProps: "A", wrapper: withToast },
    );

    const first = result.current;
    rerender("A");
    expect(result.current.show).toBe(first.show);
    expect(result.current.close).toBe(first.close);
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
