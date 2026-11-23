import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);
test("要素の誤りをまとまりの説明にしてまとまりに focus を移し、修正すると消して見出しを押してもまとまりに focus を移さず、最後の要素を削除すると追加のボタンへ focus を移す", async () => {
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
  const [save] = await screen.findAllByRole("button", { name: "保存" });

  if (save === undefined) throw new Error("保存のボタンがありません");

  await userEvent.click(save);

  const row = await screen.findByRole("group", {
    name: "行 1",
    description: "入力してください。",
  });

  await waitFor(() => {
    expect(document.activeElement).toBe(row);
  });
  const title = within(row).getByText("行 1");

  for (const name of ["行 1 を上へ", "行 1 を下へ", "行 1 を削除"]) {
    expect(within(row).getByRole("button", { name }).textContent).toBe("");
  }

  await userEvent.type(
    within(row).getByRole("textbox", { name: "名前" }),
    "記入",
  );
  expect(screen.queryByText("入力してください。")).toBeNull();
  await userEvent.click(title);
  expect(document.activeElement).not.toBe(row);
  await userEvent.click(
    within(row).getByRole("button", { name: "行 1 を削除" }),
  );
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "行を追加" }),
    );
  });
});
