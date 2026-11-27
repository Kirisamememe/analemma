import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { UploadLeaveDialog } from "../upload-leave-dialog";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("画面を離れる操作だけが未送信の写真と未保存の入力を破棄し、Escape では同じ画面に残る", async () => {
  const stay = mock(() => undefined);
  const leave = mock(() => undefined);

  const { rerender } = renderWithI18n(
    <UploadLeaveDialog leaving={{ _tag: "Idle", stay, leave }} />,
    "ja",
  );

  expect(screen.queryByRole("dialog")).toBeNull();
  rerender(<UploadLeaveDialog leaving={{ _tag: "Asking", stay, leave }} />);
  expect(
    await screen.findByRole("dialog", {
      name: "写真の追加を終了しますか？",
      description: /まだ保存していないタイトル・説明/v,
    }),
  ).toBeDefined();
  await userEvent.click(screen.getByRole("button", { name: "この画面に残る" }));
  await userEvent.keyboard("{Escape}");
  expect(stay).toHaveBeenCalledTimes(2);
  expect(leave).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "画面を離れる" }));
  expect(leave).toHaveBeenCalledTimes(1);
});

test("追加できなかった写真の枚数を伝え、破棄して完了を選んだときだけ先へ進む", async () => {
  const stay = mock(() => undefined);
  const leave = mock(() => undefined);

  renderWithI18n(
    <UploadLeaveDialog
      leaving={{ _tag: "Asking", stay, leave }}
      discarded={2}
    />,
    "ja",
  );

  expect(
    await screen.findByRole("dialog", {
      name: "追加できなかった写真を破棄しますか？",
      description: /追加できなかった写真が2枚あります/v,
    }),
  ).toBeDefined();
  await userEvent.click(screen.getByRole("button", { name: "戻る" }));
  expect(stay).toHaveBeenCalledTimes(1);
  expect(leave).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "破棄して完了" }));
  expect(leave).toHaveBeenCalledTimes(1);
});
