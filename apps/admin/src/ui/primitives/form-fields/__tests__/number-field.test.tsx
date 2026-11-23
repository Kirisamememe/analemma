import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Form } from "@/ui/primitives/form";
import { NumberField } from "@/ui/primitives/form-fields/number-field";

afterEach(cleanup);

describe("NumberField", () => {
  test("ラベルで入力欄を探せて、補足を入力欄の説明として読み上げる", () => {
    renderWithI18n(
      <NumberField
        description="小数も入力できます。"
        label="値"
        name="value"
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "値",
        description: "小数も入力できます。",
      }),
    ).toBeDefined();
  });

  test("上下の矢印キーと増減ボタンで値を変えられる", async () => {
    renderWithI18n(<NumberField defaultValue={4} label="値" name="value" />);

    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "値" });

    await userEvent.tab();
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("5");
    await userEvent.keyboard("{ArrowDown}");
    expect(input.value).toBe("4");
    await userEvent.click(
      screen.getByRole("button", { name: /Increase.*値/v }),
    );
    expect(input.value).toBe("5");
    await userEvent.click(
      screen.getByRole("button", { name: /Decrease.*値/v }),
    );
    expect(input.value).toBe("4");
  });

  test("日本語ではラベルと増減の操作を自然な語順で読み上げる", () => {
    renderWithI18n(<NumberField label="気温" name="value" />, "ja");

    expect(
      screen.getByRole("button", { name: "気温の値を増やす" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "気温の値を減らす" }),
    ).toBeDefined();
  });

  test("千より大きい値も、桁区切りを入れずに出す", async () => {
    renderWithI18n(<NumberField defaultValue={2014} label="年" name="year" />);

    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "年" });

    expect(input.value).toBe("2014");
    await userEvent.clear(input);
    await userEvent.type(input, "1234567.5");
    await userEvent.tab();
    expect(input.value).toBe("1234567.5");
  });

  test("入力欄から focus を移しても、負の小数を丸めずに送る", async () => {
    const values: (FormDataEntryValue | null)[] = [];

    renderWithI18n(
      <Form
        onSubmit={(data) => {
          values.push(data.get("value"));
        }}
      >
        <NumberField label="値" name="value" />
        <button type="submit">保存</button>
      </Form>,
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "値" }),
      "-1234.567890123",
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "保存" }),
    );
    await userEvent.keyboard("{Enter}");
    expect(values).toEqual(["-1234.567890123"]);
  });

  test("server が断った入力の知らせを、入力欄の説明として読み上げる", () => {
    renderWithI18n(
      <Form
        onSubmit={() => undefined}
        validationErrors={{ value: "値を確認してください。" }}
      >
        <NumberField label="値" name="value" />
      </Form>,
    );

    expect(
      screen.getByRole("textbox", {
        name: "値",
        description: "値を確認してください。",
      }),
    ).toBeDefined();
  });
});
