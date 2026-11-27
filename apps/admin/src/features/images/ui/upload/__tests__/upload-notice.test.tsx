import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { UploadNotice } from "../upload-notice";

import type {
  PhotoUpload,
  UploadStatus,
} from "@/features/images/upload/logic/photo-uploads";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const uploads = (...statuses: UploadStatus[]): PhotoUpload[] =>
  statuses.map((status, index) => ({
    id: index + 1,
    file: new File(["x"], `${String(index + 1)}.jpg`),
    status,
  }));

test("写真が無ければ何も出さず、変換中や追加できなかった写真があれば、見出しの下に補足を出す", () => {
  const { rerender } = renderWithI18n(<UploadNotice uploads={[]} />, "ja");

  expect(screen.queryByRole("status")).toBeNull();

  rerender(<UploadNotice uploads={uploads("added", "converting")} />);

  expect(screen.getByRole("status").textContent).toBe(
    "2枚中1枚完了1枚を変換中。閉じても変換は続きます",
  );

  rerender(<UploadNotice uploads={uploads("added", "added")} />);

  expect(screen.getByRole("status").textContent).toBe("2枚アップロード完了");

  rerender(<UploadNotice uploads={uploads("added", "interrupted")} />);

  expect(screen.getByRole("status").textContent).toBe(
    "2枚中1枚完了・1枚失敗1枚は送り直せます",
  );
});
