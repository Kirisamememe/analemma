import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Form } from "@/ui/primitives/form";
import { DateField } from "@/ui/primitives/form-fields/date/date-field";
import { DateInput } from "@/ui/primitives/form-fields/date/date-input";

afterEach(cleanup);

describe("DateField", () => {
  test("最初の segment を探せて、ラベルと補足を読み上げること", () => {
    renderWithI18n(
      <DateField
        description="記事に表示する日付です。"
        label="公開日"
        name="published"
      />,
    );

    expect(
      screen.getByRole("spinbutton", {
        name: /month.*公開日/iv,
        description: "記事に表示する日付です。",
      }),
    ).toBeDefined();
  });

  test("空欄は空文字、読み取り専用の日付はその値を送り、無効な入力欄は送らないこと", async () => {
    const values: (FormDataEntryValue | null)[] = [];

    renderWithI18n(
      <Form
        onSubmit={(data) => {
          values.push(
            data.get("empty"),
            data.get("readOnly"),
            data.get("disabled"),
          );
        }}
      >
        <DateField label="公開日" name="empty" />
        <DateField
          defaultValue="2024-02-29"
          isReadOnly
          label="作成日"
          name="readOnly"
        />
        <DateField
          defaultValue="2024-02-29"
          isDisabled
          label="更新日"
          name="disabled"
        />
        <button type="submit">保存</button>
      </Form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(values).toEqual(["", "2024-02-29", null]);
  });

  test("server が断った日付の知らせを、segment の説明として読み上げること", () => {
    renderWithI18n(
      <Form
        onSubmit={() => undefined}
        validationErrors={{ published: "公開日を確認してください。" }}
      >
        <DateField defaultValue="2024-02-29" label="公開日" name="published" />
      </Form>,
    );

    expect(
      screen.getByRole("spinbutton", {
        name: /day.*公開日/iv,
        description: /公開日を確認してください。/v,
      }),
    ).toBeDefined();
  });
});

describe("日付の未完の検証", () => {
  beforeEach(() => {
    const selection = window.getSelection();

    if (selection === null) {
      throw new Error("Selection を取得できませんでした。");
    }

    spyOn(selection, "collapse").mockImplementation(() => undefined);
  });

  afterEach(() => {
    mock.restore();
  });

  test("単独の DateInput でも一部を消した日付を送れず、補うと送れること", async () => {
    const values: (FormDataEntryValue | null)[] = [];
    const user = userEvent.setup();

    renderWithI18n(
      <Form
        onSubmit={(data) => {
          values.push(data.get("published"));
        }}
      >
        <DateInput
          aria-label="公開日"
          defaultValue="2024-02-01"
          name="published"
        />
        <button type="submit">保存</button>
      </Form>,
    );

    const day = screen.getByRole("spinbutton", { name: /day.*公開日/iv });
    const submit = screen.getByRole("button", { name: "保存" });

    await user.click(day);
    await user.keyboard("{Backspace}");
    await user.click(submit);
    expect(values).toEqual([]);

    await user.click(day);
    await user.keyboard("2");
    await user.click(submit);
    expect(values).toEqual(["2024-02-02"]);
  });

  test("未完の日付を外から完全な日付に置き換えるとその値を送れること", async () => {
    const values: (FormDataEntryValue | null)[] = [];
    const user = userEvent.setup();

    const form = (value: string) => (
      <Form
        onSubmit={(data) => {
          values.push(data.get("published"));
        }}
      >
        <DateField
          label="公開日"
          name="published"
          validationBehavior="aria"
          value={value}
        />
        <button type="button">次へ</button>
        <button type="submit">保存</button>
      </Form>
    );

    const { rerender } = renderWithI18n(form("2024-02-01"));
    const day = screen.getByRole("spinbutton", { name: /day.*公開日/iv });

    await user.click(day);
    await user.keyboard("{Backspace}");
    await user.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText("Enter the year, month, and day.")).toBeDefined();
    rerender(form("2024-03-02"));
    expect(screen.queryByText("Enter the year, month, and day.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(values).toEqual(["2024-03-02"]);
  });
});
