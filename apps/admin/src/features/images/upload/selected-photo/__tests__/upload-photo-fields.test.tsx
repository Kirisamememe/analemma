import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";
import type { ComponentProps } from "react";

import { UploadPhotoFields } from "../upload-photo-fields";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("写真に入力できる上限と例を示し、保存中は値を読めても書き換えられない", async () => {
  const change = mock<ComponentProps<typeof UploadPhotoFields>["onChange"]>(
    () => undefined,
  );

  const values = { title: "", description: "" };

  const { rerender } = renderWithI18n(
    <UploadPhotoFields values={values} isReadOnly={false} onChange={change} />,
    "ja",
  );

  const title = screen.getByRole("textbox", {
    name: "タイトル",
    description: "200文字まで",
  });

  const description = screen.getByRole("textbox", {
    name: "説明",
    description: "5,000文字まで",
  });

  expect(title.getAttribute("placeholder")).toBe("例：朝霧の湖");
  expect(description.getAttribute("placeholder")).toBe(
    "例：夜明けの湖畔で、霧が晴れるのを待って撮影しました。",
  );
  await userEvent.type(title, "朝");
  await userEvent.type(description, "海");
  expect(change).toHaveBeenNthCalledWith(1, { title: "朝" });
  expect(change).toHaveBeenNthCalledWith(2, { description: "海" });

  rerender(
    <UploadPhotoFields
      values={{ title: "朝", description: "海" }}
      isReadOnly
      onChange={change}
    />,
  );
  expect(screen.getByDisplayValue("朝")).toBe(title);
  expect(screen.getByDisplayValue("海")).toBe(description);
  await userEvent.type(title, "夕");
  await userEvent.type(description, "浜");
  expect(change).toHaveBeenCalledTimes(2);
});
