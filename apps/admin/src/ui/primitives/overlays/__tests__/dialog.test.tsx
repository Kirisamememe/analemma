import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import { type ReactNode, useState } from "react";

import { Dialog } from "@/ui/primitives/overlays/dialog";

afterEach(cleanup);

/** 開いた状態から始める Dialog に渡す値。 */
type OpenDialogProps = {
  /** 送信中か。 */
  isPending: boolean;
  /** backdrop の押下で閉じるか。 */
  isDismissable?: boolean;
};

const OpenDialog = ({
  isPending,
  isDismissable,
}: OpenDialogProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Dialog
      isDismissable={isDismissable}
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={setIsOpen}
      title="削除の確認"
    >
      <p>本文</p>
    </Dialog>
  );
};

describe("Dialog", () => {
  test("送信中は、Escape でも backdrop の押下でも閉じない", async () => {
    render(<OpenDialog isPending />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.keyboard("{Escape}");
    await userEvent.click(document.body);

    expect(screen.getByRole("dialog", { name: "削除の確認" })).toBeDefined();
  });

  test("送信中でなければ、Escape で閉じる", async () => {
    render(<OpenDialog isPending={false} />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("送信中でなければ、backdrop の押下で閉じる", async () => {
    render(<OpenDialog isPending={false} />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.click(document.body);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("backdrop の押下で閉じないとしたときは、backdrop の押下では閉じず、Escape では閉じる", async () => {
    render(<OpenDialog isDismissable={false} isPending={false} />);
    await screen.findByRole("dialog", { name: "削除の確認" });
    await userEvent.click(document.body);

    expect(screen.getByRole("dialog", { name: "削除の確認" })).toBeDefined();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
