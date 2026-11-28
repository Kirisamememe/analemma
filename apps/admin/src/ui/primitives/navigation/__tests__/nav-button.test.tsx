import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { NavButton } from "@/ui/primitives/navigation/nav-button";

afterEach(cleanup);

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
      <NavButton
        icon="log-out"
        pendingLabel="処理中"
        isPending
        onPress={onPress}
      >
        ログアウト
      </NavButton>,
    );

    expect(screen.getByRole("progressbar", { name: "処理中" })).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
