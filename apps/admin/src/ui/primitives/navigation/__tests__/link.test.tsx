import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Link } from "@/ui/primitives/navigation/link";

afterEach(cleanup);

describe("Link", () => {
  test("アイコンを添えても、リンクの名前は文言だけにする", () => {
    renderWithI18n(
      <Link href="/fixed-pages" icon="arrow-left">
        固定ページの一覧
      </Link>,
    );

    expect(
      screen.getByRole("link", { name: "固定ページの一覧" }).textContent,
    ).toBe("固定ページの一覧");
  });
});
