import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { NavigationProgress } from "@/ui/primitives/navigation/navigation-progress";

afterEach(cleanup);

describe("NavigationProgress", () => {
  test("画面を移っている間だけ、読み込んでいることを伝える", () => {
    const { rerender } = renderWithI18n(<NavigationProgress isActive />, "ja");

    expect(
      screen.getByRole("progressbar", { name: "読み込んでいます" }),
    ).toBeDefined();

    rerender(<NavigationProgress isActive={false} />);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
