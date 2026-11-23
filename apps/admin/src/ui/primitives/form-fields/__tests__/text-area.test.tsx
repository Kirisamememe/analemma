import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { Form } from "@/ui/primitives/form";
import { TextArea } from "@/ui/primitives/form-fields/text-area";

afterEach(cleanup);

describe("TextArea", () => {
  test("ラベルで入力欄を探せて、補足を入力欄の説明として読み上げる", () => {
    render(
      <TextArea
        description="改行して複数行書けます。"
        label="本文"
        name="body"
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "本文",
        description: "改行して複数行書けます。",
      }),
    ).toBeDefined();
  });

  test("Enter でフォームを送らず、改行を含む値を送る", async () => {
    const values: FormDataEntryValue[] = [];

    render(
      <Form
        onSubmit={(data) => {
          const value = data.get("body");

          if (value !== null) values.push(value);
        }}
      >
        <TextArea defaultValue="最初の行" label="本文" name="body" />
        <button type="submit">保存</button>
      </Form>,
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "本文" }),
      "{Enter}次の行",
    );

    expect(values).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(values).toEqual(["最初の行\n次の行"]);
  });

  test("server が断った入力の知らせを、入力欄の説明として読み上げる", () => {
    render(
      <Form
        onSubmit={() => undefined}
        validationErrors={{ body: "本文を確認してください。" }}
      >
        <TextArea label="本文" name="body" />
      </Form>,
    );

    expect(
      screen.getByRole("textbox", {
        name: "本文",
        description: "本文を確認してください。",
      }),
    ).toBeDefined();
  });
});
