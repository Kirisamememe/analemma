import { cleanup, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { ImageThumbnail } from "../image-thumbnail";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";
afterEach(cleanup);
test("先頭の画像があれば配信用の写真を出し、空なら画像の読み込みを行わない", () => {
  const [image] = createImageRoutes(SAMPLE_IMAGES).images();

  const view = renderWithI18n(
    <ImageThumbnail alt={image?.alt} src={image?.deliveryImages[0]?.url} />,
  );

  const thumbnail = within(view.container);
  expect(thumbnail.getByRole("img").getAttribute("src")).toContain(
    "dusk-ridge",
  );
  view.rerender(<ImageThumbnail alt={null} src={undefined} />);
  expect(thumbnail.queryByRole("img")).toBeNull();
});
