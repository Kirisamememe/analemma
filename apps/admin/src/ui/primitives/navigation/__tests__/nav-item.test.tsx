import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { NavButton, NavLink } from "@/ui/primitives/navigation/nav-item";

afterEach(cleanup);

describe("NavLink", () => {
  test("今いる画面へのリンクだけを、今いる画面として伝える", () => {
    renderWithI18n(
      <>
        <NavLink href="/" icon="house" isCurrent={false}>
          ホーム
        </NavLink>
        <NavLink href="/security" icon="shield-check" isCurrent>
          セキュリティ
        </NavLink>
      </>,
    );

    expect(
      screen.getByRole("link", { current: false, name: "ホーム" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { current: "page", name: "セキュリティ" }),
    ).toBeDefined();
  });
});

describe("NavButton", () => {
  test("送信中になると、押したときの操作を止め、待っていることを伝える", async () => {
    const onPress = mock(() => {});

    const view = renderWithI18n(
      <NavButton icon="log-out" onPress={onPress}>
        ログアウト
      </NavButton>,
      "ja",
    );

    expect(screen.queryByRole("progressbar")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    expect(onPress).toHaveBeenCalledTimes(1);

    view.rerender(
      <NavButton icon="log-out" isPending onPress={onPress}>
        ログアウト
      </NavButton>,
    );

    expect(screen.getByRole("progressbar", { name: "処理中" })).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
