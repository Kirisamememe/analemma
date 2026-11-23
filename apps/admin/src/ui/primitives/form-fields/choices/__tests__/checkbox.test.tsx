import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Form } from "@/ui/primitives/form";
import { Checkbox } from "@/ui/primitives/form-fields/choices/checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  test("ラベルで Checkbox を探せて、補足を説明として読み上げること", () => {
    render(
      <Checkbox
        description="一覧でこのページを先頭に表示します。"
        label="先頭に表示する"
        name="pinned"
      />,
    );

    expect(
      screen.getByRole("checkbox", {
        name: "先頭に表示する",
        description: "一覧でこのページを先頭に表示します。",
      }),
    ).toBeDefined();
  });

  test("チェックが必須のときだけ、ラベルに「必須」を添え、名前には含めないこと", () => {
    renderWithI18n(
      <>
        <Checkbox isRequired label="規約に同意する" name="agreed" />
        <Checkbox label="先頭に表示する" name="pinned" />
      </>,
      "ja",
    );

    expect(screen.getAllByText("必須")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: "規約に同意する" }),
    ).toBeDefined();
  });

  test("Space でチェックを切り替え、チェックしたときだけ値を送ること", async () => {
    const values: (FormDataEntryValue | null)[] = [];

    render(
      <Form
        onSubmit={(data) => {
          values.push(data.get("pinned"));
        }}
      >
        <Checkbox label="先頭に表示する" name="pinned" />
        <button type="submit">保存</button>
      </Form>,
    );

    const checkbox = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "先頭に表示する",
    });

    const submit = screen.getByRole("button", { name: "保存" });

    await userEvent.tab();
    expect(document.activeElement).toBe(checkbox);
    await userEvent.keyboard(" ");
    expect(checkbox.checked).toBe(true);
    await userEvent.click(submit);

    await userEvent.click(screen.getByText("先頭に表示する"));
    expect(checkbox.checked).toBe(false);
    await userEvent.click(submit);

    expect(values).toEqual(["true", null]);
  });

  test("server が断った入力の知らせを説明として読み上げること", () => {
    render(
      <Form
        onSubmit={() => undefined}
        validationErrors={{ pinned: "表示位置を確認してください。" }}
      >
        <Checkbox label="先頭に表示する" name="pinned" />
      </Form>,
    );

    expect(
      screen.getByRole("checkbox", {
        name: "先頭に表示する",
        description: "表示位置を確認してください。",
      }),
    ).toBeDefined();
  });
});
