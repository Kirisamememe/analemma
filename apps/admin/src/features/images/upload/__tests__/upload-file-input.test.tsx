import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { UploadFileInput } from "@/features/images/upload/upload-file-input";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("キーボードでファイル選択を開き、複数の写真と、選び直した同じ写真を受け取る", async () => {
  const receive = mock<(files: readonly File[]) => void>();
  const user = userEvent.setup();
  const { container } = renderWithI18n(<UploadFileInput onFiles={receive} />);

  const button = screen.getByRole("button");
  const opened = Promise.withResolvers<HTMLInputElement>();

  container.addEventListener("click", (event) => {
    if (event.target instanceof HTMLInputElement) opened.resolve(event.target);
  });
  await user.tab();
  expect(document.activeElement).toBe(button);
  await user.keyboard("{Enter}");

  const input = await opened.promise;
  const a = new File(["a"], "a.heic", { type: "image/heic" });
  const b = new File(["b"], "b.jpg", { type: "image/jpeg" });

  await user.upload(input, [a, b]);
  await user.upload(input, [a, b]);
  expect(receive.mock.calls).toEqual([[[a, b]], [[a, b]]]);
});

test("保存中はファイル選択を開けず、引き続き形式と大きさを確認できる", async () => {
  const receive = mock<(files: readonly File[]) => void>();

  renderWithI18n(<UploadFileInput isDisabled onFiles={receive} />);
  const button = screen.getByRole("button", { description: /JPEG.*HEIC/v });

  expect(button.hasAttribute("disabled")).toBe(true);
  await userEvent.tab();
  expect(document.activeElement).not.toBe(button);
});
