import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { NavLink } from "@/ui/primitives/navigation/nav-link";

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
