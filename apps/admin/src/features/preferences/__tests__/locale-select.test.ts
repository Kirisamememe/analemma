import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { LOCALE_STORAGE_KEY } from "@/preferences/storage-keys";
import { syncLocale } from "@/preferences/sync-locale";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { renderApp } from "@/testing/render-app";

afterEach(() => {
  cleanup();
  document.documentElement.lang = "";
  localStorage.clear();
});

const renderSecurityPage = async () => {
  const { i18n } = renderApp({
    path: "/security",
    routes: createPasskeyRoutes([]).routes,
  });

  syncLocale(i18n); // main.tsx と同じつなぎ

  return within(await screen.findByRole("complementary"));
};

describe("言語の選択", () => {
  test("今の言語を出し、選択肢をそれぞれの言語で書いた名前で並べる", async () => {
    const sidebar = await renderSecurityPage();
    const trigger = sidebar.getByRole("button", { name: /言語/v });

    expect(trigger.textContent).toBe("日本語");

    await userEvent.click(trigger);
    const list = await screen.findByRole("listbox", { name: "言語" });

    expect(
      within(list)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["English", "日本語", "简体中文"]);
    expect(
      within(list).getByRole("option", { name: "日本語", selected: true }),
    ).toBeDefined();
  });

  test("選ぶと、その場で画面の言葉と html の lang が変わり、次に開いたときのために localStorage に置く", async () => {
    const sidebar = await renderSecurityPage();

    await userEvent.click(sidebar.getByRole("button", { name: /言語/v }));
    await userEvent.click(
      await screen.findByRole("option", { name: "English" }),
    );

    const main = within(screen.getByRole("main"));
    expect(
      await main.findByRole("heading", { name: "Security" }),
    ).toBeDefined();
    expect(
      sidebar.getByRole("link", { current: "page", name: "Security" }),
    ).toBeDefined();
    expect(sidebar.getByRole("button", { name: /Language/v }).textContent).toBe(
      "English",
    );
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  test("狭い画面の引き出したナビからも選べ、ナビを開いたまま画面の言葉が変わる", async () => {
    await renderSecurityPage();

    const banner = within(screen.getByRole("banner"));
    await userEvent.click(banner.getByRole("button", { name: "ナビを開く" }));
    const drawer = within(await screen.findByRole("dialog", { name: "ナビ" }));
    await userEvent.click(drawer.getByRole("button", { name: /言語/v }));
    await userEvent.click(
      await screen.findByRole("option", { name: "简体中文" }),
    );

    expect(await screen.findByRole("dialog", { name: "导航" })).toBeDefined();
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "安全" }),
    ).toBeDefined();
    expect(document.documentElement.lang).toBe("zh-Hans");
  });
});
