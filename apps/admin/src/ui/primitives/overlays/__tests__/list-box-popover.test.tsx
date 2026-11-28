import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { SelectInput } from "@/ui/primitives/form-fields/choices/select-input";
import { NavSelect } from "@/ui/primitives/navigation/nav-select";
import type { ListBoxOption } from "@/ui/primitives/overlays/list-box-popover";

afterEach(cleanup);

const LANGUAGES = [
  { value: "en", label: "English", lang: "en" },
  { value: "ja", label: "日本語", lang: "ja" },
  { value: "zh-Hans", label: "简体中文", lang: "zh-Hans" },
] as const satisfies readonly ListBoxOption[];

const openList = async (): Promise<HTMLElement> => {
  await userEvent.click(screen.getByRole("button", { name: /言語/v }));

  return screen.findByRole("listbox", { name: "言語" });
};

describe("ListBoxPopover", () => {
  test("選んでいる選択肢だけを、選んだ状態として伝える", async () => {
    renderWithI18n(
      <SelectInput
        noneLabel="選択なし"
        placeholder="選択してください"
        aria-label="言語"
        isRequired
        options={LANGUAGES}
        value="ja"
      />,
      "ja",
    );

    const list = await openList();

    expect(
      within(list)
        .getAllByRole("option", { selected: true })
        .map((option) => option.textContent),
    ).toEqual(["日本語"]);
  });

  test("見出しを渡す部品では一覧の上に見出しを出し、渡さない部品では出さない", async () => {
    renderWithI18n(
      <NavSelect
        icon="languages"
        label="言語"
        onChange={() => {}}
        options={LANGUAGES}
        value="ja"
      />,
      "ja",
    );
    await openList();

    expect(screen.getByText("言語", { selector: "p" })).toBeDefined();

    cleanup();
    renderWithI18n(
      <SelectInput
        noneLabel="選択なし"
        placeholder="選択してください"
        aria-label="言語"
        isRequired
        options={LANGUAGES}
        value="ja"
      />,
      "ja",
    );
    await openList();

    expect(screen.queryByText("言語", { selector: "p" })).toBeNull();
  });

  test("ラベルの言語を渡した選択肢は、その言語の文として描く", async () => {
    renderWithI18n(
      <NavSelect
        icon="languages"
        label="言語"
        onChange={() => {}}
        options={LANGUAGES}
        value="ja"
      />,
      "ja",
    );

    const list = await openList();

    expect(
      LANGUAGES.map(
        ({ label }) => within(list).getByRole("option", { name: label }).lang,
      ),
    ).toEqual(["en", "ja", "zh-Hans"]);
  });
});
