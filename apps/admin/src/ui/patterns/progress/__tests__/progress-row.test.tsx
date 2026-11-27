import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { ProgressList } from "@/ui/patterns/progress/progress-list";
import { ProgressRow } from "@/ui/patterns/progress/progress-row";

afterEach(cleanup);

describe("ProgressRow", () => {
  test("終わった行は名前から開け、操作のある行は ID を渡して操作を呼ぶ", async () => {
    const onAction = mock((_id: number) => undefined);

    renderWithI18n(
      <ProgressList>
        <ProgressRow
          detail="3 MB"
          href="/images"
          id={1}
          isBusy={false}
          name="done.jpg"
          status="追加しました"
          tone="success"
        />
        <ProgressRow
          actionLabel="送り直す"
          actionName="failed.jpg を送り直す"
          detail="5 MB"
          id={2}
          isBusy={false}
          name="failed.jpg"
          onAction={onAction}
          status="送れませんでした"
          tone="danger"
        />
      </ProgressList>,
    );

    expect(
      screen.getByRole("link", { name: "done.jpg" }).getAttribute("href"),
    ).toBe("/images");
    expect(screen.queryByRole("link", { name: "failed.jpg" })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);

    await userEvent.click(
      screen.getByRole("button", { name: "failed.jpg を送り直す" }),
    );

    expect(onAction).toHaveBeenCalledWith(2);
  });

  test("進めている行には待っていることを示し、送っている操作は押しても呼ばない", async () => {
    const onAction = mock((_id: number) => undefined);

    renderWithI18n(
      <ProgressList>
        <ProgressRow
          actionLabel="送り直す"
          actionName="busy.jpg を送り直す"
          detail="5 MB"
          id={3}
          isActionPending
          isBusy
          name="busy.jpg"
          onAction={onAction}
          status="送っています"
          tone="info"
        />
      </ProgressList>,
    );

    const [button] = screen.getAllByRole("button");

    if (button !== undefined) await userEvent.click(button);

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
  });
});
