import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { useRetryFocus } from "../hooks/use-retry-focus";
import type { PhotoUpload } from "../logic/photo-uploads";
import { UploadPhotoStatus } from "../upload-photo-status";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("送り直した写真の名前・状態・リンクを切り替え、消えた再送ボタンから写真のリンクへ focus を移す", async () => {
  const photo = { id: 3, file: new File(["photo"], "lake.jpg") };
  const retry = mock<(id: number) => void>();

  const Status = ({ upload }: Record<"upload", PhotoUpload>) => {
    const focus = useRetryFocus({ retry, clear: () => {} });
    return (
      <UploadPhotoStatus
        upload={upload}
        retry={focus.retry}
        restore={focus.restore}
        imageHref={(id) => `/images/${id}`}
      />
    );
  };

  const view = renderWithI18n(
    <Status upload={{ ...photo, status: "failed" }} />,
    "ja",
  );

  const button = screen.getByRole("button", { name: "lake.jpg を送り直す" });
  await userEvent.click(button);
  expect(retry).toHaveBeenCalledWith(photo.id);
  view.rerender(
    <Status upload={{ ...photo, status: "sending", retried: true }} />,
  );
  expect(screen.getByText("送信中")).toBeDefined();
  expect(screen.queryByRole("link")).toBeNull();
  view.rerender(
    <Status upload={{ ...photo, status: "added", imageId: "lake" }} />,
  );
  const link = screen.getByRole("link", { name: /lake\.jpg.*写真を見る/v });
  expect(link.getAttribute("href")).toBe("/images/lake");
  expect(screen.getByText("追加済み")).toBeDefined();
  expect(document.activeElement).toBe(link);
});
