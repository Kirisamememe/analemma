import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { kind, page } from "../../editor/editor-samples";

import { renderApp } from "@/testing/render-app";

afterEach(cleanup);
test("要素の誤りを見出しに結び、修正すると消し、最後の要素を削除すると追加へ focus を移す", async () => {
  const fields = fieldDefinitions.parse([
    {
      type: "repeat",
      label: "行",
      key: "rows",
      fields: [{ type: "text", key: "name", label: "名前" }],
    },
  ]);
  renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
      "admin/kinds/get": () => ({ output: { ...kind, fields } }),
      "admin/fixedPages/get": () => ({
        output: { ...page, content: { rows: [{}] } },
      }),
      "admin/fixedPages/update": () => ({
        error: "INVALID_CONTENT",
        data: {
          issues: [
            {
              path: ["rows", 0],
              code: "invalid_type",
              message: "Invalid input",
            },
          ],
        },
      }),
    },
  });
  await userEvent.click(await screen.findByRole("button", { name: "保存" }));
  const row = await screen.findByRole("group", {
    name: "行 1",
    description: "入力してください。",
  });
  await userEvent.type(
    within(row).getByRole("textbox", { name: "名前" }),
    "記入",
  );
  expect(screen.queryByText("入力してください。")).toBeNull();
  await userEvent.click(
    within(row).getByRole("button", { name: "行 1 を削除" }),
  );
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "行を追加" }),
    );
  });
});
