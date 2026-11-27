import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";
import { type ReactNode, useState } from "react";

import { Modal } from "../modal";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const OpenModal = ({ isPending }: Record<"isPending", boolean>): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Modal
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={setIsOpen}
      title="写真を追加"
    >
      <p>本文</p>
    </Modal>
  );
};

test("見出しを名前に持ち、送信中を除いて閉じるボタンで閉じられる", async () => {
  const { rerender } = renderWithI18n(<OpenModal isPending />, "ja");

  const close = await screen.findByRole("button", { name: "閉じる" });
  await userEvent.click(close);
  expect(screen.getByRole("dialog", { name: "写真を追加" })).toBeDefined();
  expect(
    screen.getByRole("heading", { name: "写真を追加", level: 2 }),
  ).toBeDefined();

  rerender(<OpenModal isPending={false} />);
  await userEvent.click(close);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("下端の帯に置く内容を渡さなくても、本文の下に帯を置く", async () => {
  renderWithI18n(<OpenModal isPending={false} />, "ja");

  const modal = await screen.findByRole("dialog", { name: "写真を追加" });

  expect(within(modal).getByRole("contentinfo")).toBeDefined();
});
