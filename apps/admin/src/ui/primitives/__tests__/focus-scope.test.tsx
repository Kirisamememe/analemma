import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import { type ReactNode, useState } from "react";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";
import { FocusScope } from "@/ui/primitives/focus-scope";
import { Dialog } from "@/ui/primitives/overlays";

afterEach(cleanup);

const RemovableRow = (): ReactNode => {
  const [isShown, setIsShown] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button>範囲の外</Button>
      <FocusScope>
        <Button>最初のボタン</Button>
        {isShown && (
          <Button
            onPress={() => {
              setIsOpen(true);
            }}
          >
            行を削除
          </Button>
        )}
        <Dialog isOpen={isOpen} onOpenChange={setIsOpen} title="行を削除">
          <Button
            onPress={() => {
              setIsOpen(false);
            }}
          >
            キャンセル
          </Button>
          <Button
            onPress={() => {
              setIsShown(false);
              setIsOpen(false);
            }}
          >
            削除
          </Button>
        </Dialog>
      </FocusScope>
    </>
  );
};

const closeWith = async (name: string): Promise<void> => {
  await userEvent.click(screen.getByRole("button", { name: "行を削除" }));
  await userEvent.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name }),
  );
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
};

describe("FocusScope", () => {
  test("Dialog を開いたボタンが消えていれば、範囲の最初の要素に focus を移す", async () => {
    renderWithI18n(<RemovableRow />);
    await closeWith("削除");

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "最初のボタン" }),
    );
  });

  test("Dialog を開いたボタンが残っていれば、そのボタンに focus を戻す", async () => {
    renderWithI18n(<RemovableRow />);
    await closeWith("キャンセル");

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "行を削除" }),
    );
  });
});
