import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";
import { type ReactNode, useState } from "react";

import { StatusDialog } from "../status-dialog";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const OpenStatus = ({
  status,
}: Record<"status", "pending" | "success">): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <StatusDialog
      closeLabel="閉じる"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      status={status}
      title={status === "pending" ? "保存しています" : "保存しました"}
    />
  );
};

test("処理中は閉じる操作を出さず Escape でも閉じず、成功したら閉じるボタンで閉じられる", async () => {
  const { rerender } = renderWithI18n(<OpenStatus status="pending" />, "ja");

  await screen.findByRole("dialog", { name: "保存しています" });
  expect(screen.queryByRole("button", { name: "閉じる" })).toBeNull();
  await userEvent.keyboard("{Escape}");
  expect(screen.getByRole("dialog", { name: "保存しています" })).toBeDefined();

  rerender(<OpenStatus status="success" />);

  const close = await screen.findByRole("button", { name: "閉じる" });

  expect(screen.getByRole("dialog", { name: "保存しました" })).toBeDefined();
  await userEvent.click(close);
  expect(screen.queryByRole("dialog")).toBeNull();
});
