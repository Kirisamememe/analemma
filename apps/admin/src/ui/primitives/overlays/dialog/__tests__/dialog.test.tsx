import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import { type ReactNode, useState } from "react";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Dialog } from "@/ui/primitives/overlays/dialog/dialog";

afterEach(cleanup);

/** 開いた状態から始める Dialog に渡す値。 */
type OpenDialogProps = {
  /** 幅の広い配置を使うか。 */
  wide?: boolean;
  /** 送信中か。 */
  isPending: boolean;
  /** backdrop の押下で閉じるか。 */
  isDismissable?: boolean;
};

const OpenDialog = ({
  isPending,
  isDismissable,
  wide,
}: OpenDialogProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Dialog
      isDismissable={isDismissable}
      isOpen={isOpen}
      isPending={isPending}
      layout={wide === true ? "wide" : undefined}
      onOpenChange={setIsOpen}
      title="削除の確認"
    >
      <p>本文</p>
    </Dialog>
  );
};

describe("Dialog", () => {
  test("送信中は、Escape でも backdrop の押下でも閉じない", async () => {
    renderWithI18n(<OpenDialog isPending />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.keyboard("{Escape}");
    await userEvent.click(document.body);

    expect(screen.getByRole("dialog", { name: "削除の確認" })).toBeDefined();
  });

  test("広い Dialog は見出しを名前に持ち、送信中を除いて閉じるボタンで閉じられる", async () => {
    const { rerender } = renderWithI18n(<OpenDialog isPending wide />, "ja");

    const close = await screen.findByRole("button", { name: "閉じる" });
    await userEvent.click(close);
    expect(screen.getByRole("dialog", { name: "削除の確認" })).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "削除の確認", level: 2 }),
    ).toBeDefined();

    rerender(<OpenDialog isPending={false} wide />);
    await userEvent.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("送信中でなければ、Escape で閉じる", async () => {
    renderWithI18n(<OpenDialog isPending={false} />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("送信中でなければ、backdrop の押下で閉じる", async () => {
    renderWithI18n(<OpenDialog isPending={false} />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.click(document.body);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("backdrop の押下で閉じないとしたときは、backdrop の押下では閉じず、Escape では閉じる", async () => {
    renderWithI18n(<OpenDialog isDismissable={false} isPending={false} />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.click(document.body);

    expect(screen.getByRole("dialog", { name: "削除の確認" })).toBeDefined();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
