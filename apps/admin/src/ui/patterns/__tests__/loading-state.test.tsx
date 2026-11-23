import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { LoadingState } from "@/ui/patterns/loading-state";

afterEach(cleanup);

describe("LoadingState", () => {
  test.each(["list", "form"] as const)(
    "%s の形でも、骨組みは読ませず、読み込んでいることだけを伝える",
    (layout) => {
      renderWithI18n(<LoadingState layout={layout} />, "ja");

      expect(screen.getByRole("status").textContent).toBe("読み込んでいます");
    },
  );
});
