import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { ReorderableList } from "@/ui/primitives/collections/reorderable-list";

afterEach(cleanup);

const ITEMS = ["About", "Colophon", "Contact"].map((title) => ({
  id: title.toLowerCase(),
  textValue: title,
  children: title,
}));

describe("ReorderableList", () => {
  test("取っ手で Enter を押し、矢印で動かして Enter で置くと、並べ直した ID を渡す", async () => {
    const reorders: (readonly string[])[] = [];
    const onReorder = (ids: readonly string[]): void => {
      reorders.push(ids);
    };

    const user = userEvent.setup();

    renderWithI18n(
      <ReorderableList
        items={ITEMS}
        label="固定ページ"
        onReorder={onReorder}
      />,
      "en",
    );

    const handles = screen.getAllByRole("button", { name: /About/v });

    await user.click(screen.getByRole("row", { name: "About" }));
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(handles[0] ?? null);
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(reorders).toEqual([["colophon", "about", "contact"]]);
  });

  test("元の位置に置いたときは、ID を渡さない", async () => {
    const reorders: (readonly string[])[] = [];
    const onReorder = (ids: readonly string[]): void => {
      reorders.push(ids);
    };

    const user = userEvent.setup();

    renderWithI18n(
      <ReorderableList
        items={ITEMS}
        label="固定ページ"
        onReorder={onReorder}
      />,
      "en",
    );

    await user.click(screen.getByRole("row", { name: "Colophon" }));
    await user.keyboard("{Tab}{Enter}{Enter}");

    expect(reorders).toEqual([]);
  });

  test("並べ直しを止めている間は、取っ手で Enter を押しても動かせない", async () => {
    const reorders: (readonly string[])[] = [];
    const onReorder = (ids: readonly string[]): void => {
      reorders.push(ids);
    };

    const user = userEvent.setup();

    renderWithI18n(
      <ReorderableList
        isDisabled
        items={ITEMS}
        label="固定ページ"
        onReorder={onReorder}
      />,
      "en",
    );

    await user.click(screen.getByRole("row", { name: "About" }));
    await user.keyboard("{Tab}{Enter}{ArrowDown}{Enter}");

    expect(reorders).toEqual([]);
  });
});
