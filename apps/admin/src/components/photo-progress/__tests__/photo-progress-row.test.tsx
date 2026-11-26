import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { PhotoProgressRow } from "@/components/photo-progress/photo-progress-row";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { ActionList } from "@/ui/primitives/collections";

afterEach(cleanup);

describe("PhotoProgressRow", () => {
  test("画像があれば名前をその画面へのリンクにし、無ければ文字のままにすること", () => {
    renderWithI18n(
      <ActionList>
        <PhotoProgressRow
          busy={false}
          detail="18.4 MB"
          href="/images/019b"
          name="a.jpg"
          status="Added"
          tone="success"
        />
        <PhotoProgressRow
          busy
          detail="3.2 MB"
          name="b.jpg"
          status="Importing"
          tone="info"
        />
      </ActionList>,
    );

    expect(
      screen.getByRole("link", { name: "a.jpg" }).getAttribute("href"),
    ).toBe("/images/019b");
    expect(screen.queryByRole("link", { name: "b.jpg" })).toBeNull();
    expect(screen.getByText("Added")).toBeDefined();
    expect(screen.getByText("Importing")).toBeDefined();
  });
});
