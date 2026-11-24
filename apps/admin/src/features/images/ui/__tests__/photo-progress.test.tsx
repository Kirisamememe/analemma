import {
  cleanup,
  isInaccessible,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { PhotoProgress } from "../photo-progress";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test.each(["top", "center"] as const)(
  "%s に置いても、文言を見せ、読み上げには1度だけ伝える",
  async (place) => {
    renderWithI18n(
      <PhotoProgress label="次の写真を待っています" place={place} />,
      "ja",
    );

    expect(screen.getByText("次の写真を待っています")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "次の写真を待っています",
      );
    });
    expect(
      screen
        .getAllByText("次の写真を待っています")
        .filter((element) => !isInaccessible(element)),
    ).toHaveLength(1);
  },
);
