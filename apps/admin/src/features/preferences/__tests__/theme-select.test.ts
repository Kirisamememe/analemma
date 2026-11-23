import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { THEME_STORAGE_KEY } from "@/preferences/storage-keys";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

beforeEach(() => {
  delete document.documentElement.dataset["theme"]; // ほかのテストの story が残す
});

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset["theme"];
  localStorage.clear();
});

const renderSecurityPage = async (): Promise<HTMLElement> => {
  renderApp({ path: "/security", routes: createPasskeyRoutes([]).routes });

  return screen.findByRole("complementary");
};

const themeButton = (nav: HTMLElement): HTMLElement =>
  within(nav).getByRole("button", { name: /配色/v });

const choose = async (nav: HTMLElement, option: string): Promise<void> => {
  await userEvent.click(themeButton(nav));
  await userEvent.click(await screen.findByRole("option", { name: option }));
  await waitFor(() => {
    expect(screen.queryByRole("listbox")).toBeNull();
  });
};

describe("配色の選択", () => {
  test("何も選んでいなければ自動を出し、自動・ライト・ダークから選べる", async () => {
    const sidebar = await renderSecurityPage();

    expect(themeButton(sidebar).textContent).toBe("自動");

    await userEvent.click(themeButton(sidebar));
    const list = await screen.findByRole("listbox", { name: "配色" });

    expect(
      within(list)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["自動", "ライト", "ダーク"]);
    expect(
      within(list).getByRole("option", { name: "自動", selected: true }),
    ).toBeDefined();
  });

  test("最初の描画の前に当てた配色を、今の配色として出す", async () => {
    document.documentElement.dataset["theme"] = "light";

    const sidebar = await renderSecurityPage();

    expect(themeButton(sidebar).textContent).toBe("ライト");
  });

  test("選ぶと html の data-theme で固定し、自動に戻すと外して OS に従わせる。どちらも localStorage に置く", async () => {
    const sidebar = await renderSecurityPage();

    await choose(sidebar, "ダーク");

    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    await waitFor(() => {
      expect(themeButton(sidebar).textContent).toBe("ダーク");
    });

    await choose(sidebar, "自動");

    expect(document.documentElement.dataset["theme"]).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  test("別のタブで配色を変えた後でも、今の配色を選び直すと次回の配色になる", async () => {
    document.documentElement.dataset["theme"] = "light";
    const sidebar = await renderSecurityPage();
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    await choose(sidebar, "ライト");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  test("引き出したナビで選んだ配色を、広い画面のナビにも出す", async () => {
    const sidebar = await renderSecurityPage();

    const banner = within(screen.getByRole("banner"));
    await userEvent.click(banner.getByRole("button", { name: "ナビを開く" }));
    await choose(await screen.findByRole("dialog", { name: "ナビ" }), "ライト");

    expect(document.documentElement.dataset["theme"]).toBe("light");
    await waitFor(() => {
      expect(themeButton(sidebar).textContent).toBe("ライト");
    });
    expect(screen.getByRole("dialog", { name: "ナビ" })).toBeDefined();
  });
});
