import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { EditorHeader } from "../editor-header";

import { createTestApp } from "@/testing/create-test-app";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind, page } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async () => {
  const { routes } = createFixedPageRoutes({ kinds: [], pages: [] });
  const app = createTestApp({ path: "/", routes });

  await app.router.load();

  return { wrapper: withAppProviders(app) };
};

const save = <button type="submit">保存</button>;

test("作成では見出しだけを出し、削除と保存の操作を置かない", async () => {
  render(
    <EditorHeader
      pageProps={{ kind, onSaved: () => undefined }}
      onDeleteOpen={() => undefined}
      save={save}
    />,
    await setUp(),
  );

  expect(
    screen.getByRole("heading", { name: "新しい固定ページ" }),
  ).toBeDefined();
  expect(screen.queryByRole("button")).toBeNull();
});

test("編集では、削除と保存の操作を見出しに並べる", async () => {
  render(
    <EditorHeader
      pageProps={{
        kind,
        page,
        onSaved: () => undefined,
        onDeleted: () => undefined,
      }}
      onDeleteOpen={() => undefined}
      save={save}
    />,
    await setUp(),
  );

  expect(
    screen.getByRole("heading", { name: "固定ページを編集" }),
  ).toBeDefined();
  expect(screen.getAllByRole("button")).toEqual([
    screen.getByRole("button", { name: "固定ページを削除" }),
    screen.getByRole("button", { name: "保存" }),
  ]);
});
