import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { ErrorState } from "@/ui/patterns/error-state";

afterEach(cleanup);

const TITLE = "トークンを読み込めませんでした";

describe("ErrorState", () => {
  test("読み込めなかったことと次にすることを、すぐに読み上げる知らせで出す", () => {
    renderWithI18n(
      <ErrorState
        isRetrying={false}
        layout="inline"
        level={3}
        onRetry={() => undefined}
        title={TITLE}
      />,
      "ja",
    );

    const alert = within(screen.getByRole("alert"));

    expect(alert.getByRole("heading", { level: 3, name: TITLE })).toBeDefined();
    expect(
      alert.getByText("接続を確かめてから、もう一度試してください。"),
    ).toBeDefined();
  });

  test("もう一度試すボタンを押すと、取り直す", async () => {
    let retries = 0;

    renderWithI18n(
      <ErrorState
        isRetrying={false}
        layout="screen"
        level={2}
        onRetry={() => {
          retries += 1;
        }}
        title={TITLE}
      />,
      "ja",
    );
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));

    expect(retries).toBe(1);
  });

  test("取り直している間は、ボタンを送信中にして押させない", async () => {
    let retries = 0;

    renderWithI18n(
      <ErrorState
        isRetrying
        layout="inline"
        level={3}
        onRetry={() => {
          retries += 1;
        }}
        title={TITLE}
      />,
      "ja",
    );

    const button = screen.getByRole("button", { name: /もう一度試す/v });

    expect(
      within(button).getByRole("progressbar", { name: "処理中" }),
    ).toBeDefined();

    await userEvent.click(button);

    expect(retries).toBe(0);
  });

  test("取り直しも失敗したら、まだ読み込めないことを、知らせを出し直して伝える", () => {
    const view = (isRetrying: boolean) => (
      <ErrorState
        isRetrying={isRetrying}
        layout="inline"
        level={3}
        onRetry={() => undefined}
        title={TITLE}
      />
    );
    const { rerender } = renderWithI18n(view(false), "ja");
    const first = screen.getByRole("alert");

    rerender(view(true));

    expect(screen.getByRole("alert")).toBe(first);

    rerender(view(false));

    const second = screen.getByRole("alert");

    expect(second).not.toBe(first);
    expect(within(second).getByText("まだ読み込めません。")).toBeDefined();
    expect(
      within(second).getByText("時間をおいて試してください。"),
    ).toBeDefined();
    expect(
      within(second).queryByText(
        "接続を確かめてから、もう一度試してください。",
      ),
    ).toBeNull();
    expect(within(second).getByRole("heading", { name: TITLE })).toBeDefined();

    rerender(view(true));
    rerender(view(false));

    expect(screen.getByRole("alert")).not.toBe(second);
  });
});
