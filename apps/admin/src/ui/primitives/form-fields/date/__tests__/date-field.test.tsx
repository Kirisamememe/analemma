import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Form } from "@/ui/primitives/form";
import { DateField } from "@/ui/primitives/form-fields/date/date-field";

afterEach(cleanup);

describe("DateField", () => {
  test("最初の日付の桁を探せて、ラベルと補足を読み上げること", () => {
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

  test("server が断った日付の知らせを、日付の桁の説明として読み上げること", () => {
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
