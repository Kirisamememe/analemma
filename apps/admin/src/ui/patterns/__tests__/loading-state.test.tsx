import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { LoadingState } from "@/ui/patterns/loading-state";

afterEach(cleanup);

describe("LoadingState", () => {
  test.each(["list", "form"] as const)(
    "%s の形でも、骨組みは読ませず、読み込んでいることだけを伝える",
    async (layout) => {
      renderWithI18n(<LoadingState layout={layout} />, "ja");

      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      expect(status.contains(await screen.findByText("読み込んでいます"))).toBe(
        true,
      );
    },
  );
});
