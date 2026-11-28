import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { ImageFieldPanel } from "../image-field-panel";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("任意の未入力欄に画像一覧への入口が一つある", async () => {
  const choose = mock(() => undefined);
  renderWithI18n(
    <ImageFieldPanel
      label="肖像"
      target="紹介 / 肖像"
      errorId="portrait-error"
      onRemove={() => undefined}
      required={false}
      selected={false}
      onChoose={choose}
    />,
    "ja",
  );
  const actions = screen.getAllByRole("button");
  expect(actions).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", { name: "画像一覧から選ぶ（紹介 / 肖像）" }),
  );
  expect(choose).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("必須")).toBeNull();
  expect(screen.getByText("任意")).toBeDefined();
  expect(screen.getByRole("group", { name: "肖像" })).toBeDefined();
});

test("配信用の画像がなくても名前と非公開の状態を保ち、必須の画像を差し替えられる", () => {
  const [image] = createImageRoutes([
    { title: "青い海", published: false },
  ]).images();

  renderWithI18n(
    <ImageFieldPanel
      label="肖像"
      target="紹介 / 肖像"
      errorId="portrait-error"
      onRemove={() => undefined}
      onChoose={() => undefined}
      required
      selected
      image={image}
    />,
    "ja",
  );
  expect(screen.getByText("青い海")).toBeDefined();
  expect(screen.getByText("非公開")).toBeDefined();
  expect(screen.getByText("必須")).toBeDefined();
  expect(screen.getByRole("group", { name: /肖像.*必須/v })).toBeDefined();
  expect(
    screen.getByRole("button", { name: "差し替える（紹介 / 肖像）" }),
  ).toBeDefined();
  expect(screen.queryByRole("button", { name: /外す/v })).toBeNull();
});
