import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

test("各型の入力、変更した slug とタイトルを送り、任意の空欄は省いて更新する", async () => {
  const fields = fieldDefinitions.parse([
    { type: "text", key: "name", label: "名前" },
    { type: "url", key: "url", label: "リンク先" },
    { type: "longText", key: "body", label: "本文" },
    { type: "number", key: "count", label: "件数" },
    { type: "boolean", key: "pin", label: "先頭に表示" },
    { type: "date", key: "day", label: "日付" },
    {
      type: "select",
      key: "color",
      label: "色",
      options: [{ value: "red", label: "赤" }],
    },
    { type: "text", key: "empty", label: "補足", optional: true },
  ]);

  let sent: unknown;

  const { calls } = renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
      "admin/kinds/get": () => ({ output: { ...kind, fields } }),
      "admin/fixedPages/get": () => ({
        output: { ...page, content: { day: "2026-11-23" } },
      }),
      "admin/fixedPages/update": (input) => {
        sent = input;
        return { output: { ...page, ...input } };
      },
    },
  });

  const user = userEvent.setup();
  const slug = await screen.findByRole("textbox", { name: "slug" });
  await user.clear(slug);
  await user.type(slug, "updated");
  const title = screen.getByRole("textbox", { name: "タイトル" });
  await user.clear(title);
  await user.type(title, "変更");
  await user.type(screen.getByRole("textbox", { name: "名前" }), "見出し");
  await user.type(
    screen.getByRole("textbox", {
      name: "リンク先",
      description: "http:// か https:// で始まる URL を入力します。",
    }),
    "https://example.com",
  );

  const pin = screen.getByRole<HTMLInputElement>("checkbox", {
    name: "先頭に表示",
  });

  expect([pin.required, pin.getAttribute("aria-required")]).toEqual([
    false,
    null,
  ]);
  await user.type(screen.getByRole("textbox", { name: "本文" }), "春{Enter}夏");
  await user.type(screen.getByRole("textbox", { name: "件数" }), "0");
  await user.click(screen.getByRole("checkbox", { name: "先頭に表示" }));
  const selection = window.getSelection();

  if (selection === null) throw new Error("Selection がありません");

  const collapse = spyOn(selection, "collapse").mockImplementation(
    () => undefined,
  );

  try {
    await user.click(screen.getByRole("spinbutton", { name: /日.*日付/v }));
    await user.keyboard("{ArrowUp}");
    await user.click(
      within(screen.getByRole("main")).getByRole("button", { name: /色/v }),
    );
    await user.click(screen.getByRole("option", { name: "赤" }));
    const [save] = await screen.findAllByRole("button", { name: "保存" });

    if (save === undefined) throw new Error("保存のボタンがありません");

    await userEvent.click(save);
    expect(await screen.findByText("固定ページを更新しました。")).toBeDefined();
  } finally {
    collapse.mockRestore();
  }

  expect(sent).toEqual({
    id: page.id,
    slug: "updated",
    title: "変更",
    content: {
      name: "見出し",
      url: "https://example.com",
      body: "春\n夏",
      count: 0,
      pin: true,
      day: "2026-11-24",
      color: "red",
    },
  });
  expect(calls.filter((path) => path === "admin/fixedPages/get")).toHaveLength(
    1,
  );
});

test.each(["入力中", "別の欄に移った後"])(
  "空の日付に年だけ入れて離れるとき、%sも確かめる",
  async (when) => {
    const user = userEvent.setup();

    const { history } = renderApp({
      path: "/fixed-pages/" + page.id,
      routes: {
        "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
        "admin/kinds/get": () => ({
          output: {
            ...kind,
            fields: fieldDefinitions.parse([
              { type: "date", key: "day", label: "日付", optional: true },
            ]),
          },
        }),
        "admin/fixedPages/get": () => ({
          output: page,
        }),
      },
    });

    const year = await screen.findByRole("spinbutton", { name: /年.*日付/v });
    const selection = window.getSelection();

    if (selection === null) throw new Error("Selection がありません");

    const collapse = spyOn(selection, "collapse").mockImplementation(
      () => undefined,
    );

    try {
      await user.click(year);
      await user.keyboard("2026");

      if (when === "別の欄に移った後") {
        await user.click(screen.getByRole("textbox", { name: "タイトル" }));
      }

      history.push("/");
      expect(
        await screen.findByRole("dialog", {
          name: "保存していない変更があります",
        }),
      ).toBeDefined();
    } finally {
      collapse.mockRestore();
    }
  },
);

test("空の日付に年だけ入れてから、ナビで言語を替えても、入れた年を残す", async () => {
  const user = userEvent.setup();

  renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
      "admin/kinds/get": () => ({
        output: {
          ...kind,
          fields: fieldDefinitions.parse([
            { type: "date", key: "day", label: "日付", optional: true },
          ]),
        },
      }),
      "admin/fixedPages/get": () => ({ output: page }),
    },
  });

  const year = await screen.findByRole("spinbutton", { name: /年.*日付/v });
  const selection = window.getSelection();

  if (selection === null) throw new Error("Selection がありません");

  const collapse = spyOn(selection, "collapse").mockImplementation(
    () => undefined,
  );

  try {
    await user.click(year);
    await user.keyboard("2026");
    await user.click(screen.getByRole("textbox", { name: "タイトル" }));

    const sidebar = within(screen.getByRole("complementary"));
    await user.click(sidebar.getByRole("button", { name: /言語/v }));
    await user.click(await screen.findByRole("option", { name: "English" }));
  } finally {
    collapse.mockRestore();
  }

  expect(
    (await screen.findByRole("spinbutton", { name: /year.*日付/v }))
      .textContent,
  ).toBe("2026");
});

test("数値を入力した欄から focus を移さずに離れるときも確かめる", async () => {
  const { history } = renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: page.createdAt } }),
      "admin/kinds/get": () => ({
        output: {
          ...kind,
          fields: fieldDefinitions.parse([
            { type: "number", key: "count", label: "件数" },
          ]),
        },
      }),
      "admin/fixedPages/get": () => ({
        output: { ...page, content: { count: 7 } },
      }),
    },
  });

  const input = await screen.findByRole<HTMLInputElement>("textbox", {
    name: "件数",
  });

  await userEvent.type(input, "{End}2");
  expect(input.value).toBe("72");
  history.push("/");
  expect(
    await screen.findByRole("dialog", { name: "保存していない変更があります" }),
  ).toBeDefined();
});
