import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { ImageFieldPanel } from "../../image-field-panel";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

afterEach(cleanup);

test("タッチで最初にボタンの位置を押すと写真の操作を表示し、もう一度押すと実行する", () => {
  const choose = mock(() => undefined);
  const [image] = createImageRoutes(SAMPLE_IMAGES).images();

  renderWithI18n(
    <ImageFieldPanel
      label="表紙"
      target="表紙"
      errorId="cover-error"
      onRemove={() => undefined}
      onChoose={choose}
      required={false}
      selected
      image={image}
    />,
    "ja",
  );

  const button = screen.getByRole("button", { name: "差し替える（表紙）" });

  const tap = () => {
    fireEvent.pointerDown(button, { pointerType: "touch" });
    fireEvent.pointerUp(button, { pointerType: "touch" });
    fireEvent.click(button, { detail: 1 });
  };

  tap();
  expect(choose).not.toHaveBeenCalled();
  tap();
  expect(choose).toHaveBeenCalledTimes(1);
  fireEvent.pointerDown(document.body, { pointerType: "touch" });
  tap();
  expect(choose).toHaveBeenCalledTimes(1);
  fireEvent.focusIn(document.body);
  tap();
  expect(choose).toHaveBeenCalledTimes(1);
});
