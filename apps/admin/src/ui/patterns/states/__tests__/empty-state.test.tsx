import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { EmptyState } from "@/ui/patterns/states/empty-state";

afterEach(cleanup);

describe("EmptyState", () => {
  test("見出しと補足と操作を出す", () => {
    render(
      <EmptyState
        actions={<button type="button">作る</button>}
        description="作ったものは、ここに並びます。"
        icon="file-text"
        title="まだありません"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "まだありません" }),
    ).toBeDefined();
    expect(screen.getByText("作ったものは、ここに並びます。")).toBeDefined();
    expect(screen.getByRole("button", { name: "作る" })).toBeDefined();
  });

  test("空の補足と、出さない操作は描かない", () => {
    const { container } = render(
      <EmptyState
        actions={false}
        description=""
        icon="file-text"
        title="まだありません"
      />,
    );

    expect(container.textContent).toBe("まだありません");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
