import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { renderWithI18n } from "../../../testing/render-with-i18n";
import { SideNav } from "../side-nav";

afterEach(cleanup);

test("見出しのあるまとまりのリストにだけ、見出しの名前を付ける", () => {
  renderWithI18n(
    <SideNav
      appName="Stilus"
      drawerLabel="ナビ"
      footer={null}
      groups={[
        {
          items: [
            { href: "/", icon: "house", label: "ホーム", isCurrent: false },
          ],
        },
        {
          heading: "設定",
          items: [
            {
              href: "/security",
              icon: "shield-check",
              label: "セキュリティ",
              isCurrent: true,
            },
          ],
        },
      ]}
      label="メイン"
    />,
  );

  const nav = within(screen.getByRole("navigation", { name: "メイン" }));
  const settings = within(nav.getByRole("list", { name: "設定" }));
  const home = within(nav.getByRole("list", { name: "" }));

  expect(settings.getByRole("link", { name: "セキュリティ" })).toBeDefined();
  expect(home.getByRole("link", { name: "ホーム" })).toBeDefined();
});
