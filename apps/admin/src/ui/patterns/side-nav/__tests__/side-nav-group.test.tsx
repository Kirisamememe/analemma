import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { SideNavGroup } from "@/ui/patterns/side-nav/side-nav-group";

afterEach(cleanup);

test("見出しのあるまとまりのリストにだけ、見出しの名前を付ける", () => {
  renderWithI18n(
    <>
      <SideNavGroup
        items={[
          { href: "/", icon: "house", label: "ホーム", isCurrent: false },
        ]}
      />
      <SideNavGroup
        heading="設定"
        items={[
          {
            href: "/security",
            icon: "shield-check",
            label: "セキュリティ",
            isCurrent: true,
          },
        ]}
      />
    </>,
  );

  const settings = within(screen.getByRole("list", { name: "設定" }));
  const home = within(screen.getByRole("list", { name: "" }));

  expect(settings.getByRole("link", { name: "セキュリティ" })).toBeDefined();
  expect(home.getByRole("link", { name: "ホーム" })).toBeDefined();
});
