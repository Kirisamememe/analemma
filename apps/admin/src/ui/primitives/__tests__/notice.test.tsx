import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { Notice } from "../notice";

afterEach(cleanup);

describe("Notice", () => {
  test("誤りの知らせは、すぐに読み上げる alert にする", () => {
    render(<Notice tone="danger">ログインできませんでした</Notice>);

    expect(screen.getByRole("alert").textContent).toBe(
      "ログインできませんでした",
    );
  });

  test.each(["info", "success", "warning"] as const)(
    "%s の知らせは、割り込まない status にする",
    (tone) => {
      render(<Notice tone={tone}>保存しました</Notice>);

      expect(screen.getByRole("status").textContent).toBe("保存しました");
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );
});
