import { render, screen } from "@testing-library/react";
import { expect, test } from "bun:test";

import { PublishLabel } from "../publish-label";

test.each([
  [true, "公開中"],
  [false, "下書き"],
])("公開状態に合った文言を出すこと", (published, label) => {
  render(PublishLabel({ published }));

  expect(screen.getByText(label)).toBeDefined();
});
