import {
  act,
  cleanup,
  fireEvent,
  type RenderResult,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, jest, test } from "bun:test";
import type { ReactNode } from "react";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { ToastProvider } from "@/ui/primitives/overlays/toast";
import { useShowToast } from "@/ui/primitives/overlays/use-show-toast";

const ToastControls = (): ReactNode => {
  const showToast = useShowToast();

  return (
    <>
      <button
        onClick={() => {
          showToast({ tone: "success", message: "保存しました。" });
        }}
        type="button"
      >
        保存する
      </button>
      <button
        onClick={() => {
          showToast({ tone: "danger", message: "保存できませんでした。" });
        }}
        type="button"
      >
        保存に失敗する
      </button>
    </>
  );
};

const renderToastControls = (): RenderResult =>
  renderWithI18n(
    <ToastProvider>
      <ToastControls />
    </ToastProvider>,
    "ja",
  );

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe("Toast", () => {
  test("出した文を alert で知らせる", () => {
    renderToastControls();
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(screen.getByRole("alert").textContent).toBe("保存しました。");
  });

  test("別の ToastProvider には知らせを出さない", () => {
    const first = renderToastControls();
    renderToastControls();
    fireEvent.click(
      within(first.container).getByRole("button", { name: "保存する" }),
    );

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  test("訳した名前の閉じるボタンで消える", async () => {
    renderToastControls();
    await userEvent.click(
      screen.getByRole("button", { name: "保存に失敗する" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("success は5000msで消える", () => {
    jest.useFakeTimers();
    renderToastControls();
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    act(() => {
      jest.advanceTimersByTime(4999);
    });
    expect(screen.getByRole("alert").textContent).toBe("保存しました。");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("danger は時間が経っても残る", () => {
    jest.useFakeTimers();
    renderToastControls();
    fireEvent.click(screen.getByRole("button", { name: "保存に失敗する" }));

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(screen.getByRole("alert").textContent).toBe(
      "保存できませんでした。",
    );
  });
});
