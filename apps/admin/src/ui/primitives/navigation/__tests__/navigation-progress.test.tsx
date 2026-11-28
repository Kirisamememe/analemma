import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { NavigationProgress } from "@/ui/primitives/navigation/navigation-progress";

afterEach(cleanup);

describe("NavigationProgress", () => {
  test("読み込んでいる間だけ、読み込み中の progressbar を出す", () => {
    const { rerender } = renderWithI18n(
      <NavigationProgress label="読み込んでいます" isActive />,
      "ja",
    );

    expect(
      screen.getByRole("progressbar", { name: "読み込んでいます" }),
    ).toBeDefined();

    rerender(<NavigationProgress label="読み込んでいます" isActive={false} />);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
