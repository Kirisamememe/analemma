import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Form } from "@/ui/primitives/form";
import { Select } from "@/ui/primitives/form-fields/choices/select";

afterEach(cleanup);

const OPTIONS = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
];

describe("Select", () => {
  test("Enter で選択肢を開き、選んだ値を送ること", async () => {
    const values: (FormDataEntryValue | null)[] = [];

    renderWithI18n(
      <Form
        onSubmit={(data) => {
          values.push(data.get("season"));
        }}
      >
        <Select
          noneLabel="選択なし"
          placeholder="選択してください"
          defaultValue="spring"
          description="公開サイトで使う季節。"
          requiredLabel="必須"
          label="季節"
          name="season"
          options={OPTIONS}
        />
        <button type="submit">保存</button>
      </Form>,
      "ja",
    );

    const trigger = screen.getByRole("button", {
      name: /季節/v,
      description: "公開サイトで使う季節。",
    });

    await userEvent.tab();
    expect(document.activeElement === trigger).toBe(true);
    await userEvent.keyboard("{Enter}");
    expect(
      screen.getByRole("option", { name: "春", selected: true }),
    ).toBeDefined();
    expect(screen.queryByRole("option", { name: "選択なし" })).toBeNull();
    await userEvent.click(screen.getByRole("option", { name: "夏" }));
    await waitFor(() => {
      expect(screen.queryByRole("listbox") === null).toBe(true);
    });
    expect(document.activeElement === trigger).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(values).toEqual(["summer"]);
  });

  test("任意の Select は選択を解除して空の値を送れること", async () => {
    const values: (FormDataEntryValue | null)[] = [];

    renderWithI18n(
      <Form
        onSubmit={(data) => {
          values.push(data.get("season"));
        }}
      >
        <Select
          noneLabel="選択なし"
          placeholder="選択してください"
          defaultValue="spring"
          label="季節"
          name="season"
          options={OPTIONS}
        />
        <button type="submit">保存</button>
      </Form>,
      "ja",
    );

    await userEvent.click(screen.getByRole("button", { name: /季節/v }));
    await userEvent.click(screen.getByRole("option", { name: "選択なし" }));
    expect(
      screen.getByRole("button", { name: /季節.*選択なし|選択なし.*季節/v }),
    ).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(values).toEqual([""]);
  });

  test("Escape で選択肢を閉じ、元の選択と focus に戻ること", async () => {
    renderWithI18n(
      <Select
        noneLabel="選択なし"
        placeholder="選択してください"
        defaultValue="spring"
        label="季節"
        name="season"
        options={OPTIONS}
      />,
    );

    const trigger = screen.getByRole("button", { name: /季節/v });

    await userEvent.click(trigger);
    await userEvent.keyboard("{ArrowDown}{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox") === null).toBe(true);
    });
    expect(trigger.textContent).toBe("春");
    expect(document.activeElement === trigger).toBe(true);
  });

  test("server が断った選択肢の知らせを説明として読み上げること", () => {
    renderWithI18n(
      <Form
        onSubmit={() => undefined}
        validationErrors={{ season: "季節を選び直してください。" }}
      >
        <Select
          noneLabel="選択なし"
          placeholder="選択してください"
          label="季節"
          name="season"
          options={OPTIONS}
        />
      </Form>,
    );

    expect(
      screen.getByRole("button", {
        name: /季節/v,
        description: "季節を選び直してください。",
      }),
    ).toBeDefined();
  });
});
