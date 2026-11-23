import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { PageTransition } from "@/ui/layout/page-transition";

afterEach(cleanup);

describe("PageTransition", () => {
  test("画面を見分ける値が同じ間は中身の入力を残し、変わると中身を作り直す", async () => {
    const { rerender } = renderWithI18n(
      <PageTransition pageKey="/fixed-pages/a">
        <input aria-label="タイトル" />
      </PageTransition>,
    );

    await userEvent.type(screen.getByRole("textbox"), "紹介");

    rerender(
      <PageTransition pageKey="/fixed-pages/a">
        <input aria-label="タイトル" />
      </PageTransition>,
    );
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("紹介");

    rerender(
      <PageTransition pageKey="/fixed-pages/b">
        <input aria-label="タイトル" />
      </PageTransition>,
    );
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("");
  });
});
