import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { NavSelect } from "@/ui/primitives/navigation/nav-select";

afterEach(cleanup);

const LANGUAGES = [
  { value: "en", label: "English", lang: "en" },
  { value: "ja", label: "日本語", lang: "ja" },
  { value: "zh-Hans", label: "简体中文", lang: "zh-Hans" },
] as const;

describe("NavSelect", () => {
  test("今の値を行に出し、何を選ぶ行かと今の値を名前で伝える", () => {
    renderWithI18n(
      <NavSelect
        icon="languages"
        label="言語"
        onChange={() => {}}
        options={LANGUAGES}
        value="ja"
      />,
    );

    const trigger = screen.getByRole("button", { name: /言語/v });

    expect(trigger.textContent).toBe("日本語");
    expect(screen.getByRole("button", { name: /日本語/v })).toBe(trigger);
  });

  test("押すと、見出しと、選んでいる行にチェックを付けた一覧を開き、選び直した値を知らせる", async () => {
    const onChange = mock<(value: string) => void>();

    renderWithI18n(
      <NavSelect
        icon="languages"
        label="言語"
        onChange={onChange}
        options={LANGUAGES}
        value="ja"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /言語/v }));

    const list = await screen.findByRole("listbox", { name: "言語" });
    expect(
      within(list).getByRole("option", { name: "日本語", selected: true }),
    ).toBeDefined();
    expect(screen.getByText("言語", { selector: "p" })).toBeDefined();

    await userEvent.click(
      within(list).getByRole("option", { name: "简体中文", selected: false }),
    );

    expect(onChange.mock.calls).toEqual([["zh-Hans"]]);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  test("Tab で行に移って Enter で一覧を開き、Escape で閉じると行に focus を戻す", async () => {
    const onChange = mock<(value: string) => void>();

    renderWithI18n(
      <NavSelect
        icon="languages"
        label="言語"
        onChange={onChange}
        options={LANGUAGES}
        value="ja"
      />,
    );

    const trigger = screen.getByRole("button", { name: /言語/v });

    await userEvent.tab();
    expect(document.activeElement === trigger).toBe(true);
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("listbox", { name: "言語" });
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
    expect(document.activeElement === trigger).toBe(true);
    expect(onChange.mock.calls).toEqual([]);
  });

  test("ラベルに言語を付けた選択肢を選んでいるとき、行の値もその言語の文として描く", () => {
    renderWithI18n(
      <NavSelect
        icon="languages"
        label="Language"
        onChange={() => {}}
        options={LANGUAGES}
        value="zh-Hans"
      />,
      "en",
    );

    const trigger = screen.getByRole("button", { name: /Language/v });

    expect(within(trigger).getByText("简体中文").lang).toBe("zh-Hans");
  });
});
