import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { PhotoPreview } from "../photo-preview";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("配信用の URL の写真を表示し、読めなければ、表示できないときの文言に替える", () => {
  const url = "https://media.example/lake.avif";

  renderWithI18n(<PhotoPreview missing="プレビューなし" source={url} />, "ja");

  const photo = screen.getByAltText("");

  expect(photo.getAttribute("src")).toBe(url);
  expect(screen.queryByText("プレビューなし")).toBeNull();

  fireEvent.error(photo);

  expect(screen.getByText("プレビューなし")).toBeDefined();
});
