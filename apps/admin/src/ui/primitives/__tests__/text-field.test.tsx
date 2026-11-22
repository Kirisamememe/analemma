import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { Form } from "../form";
import { TextField } from "../text-field";

afterEach(cleanup);

describe("TextField", () => {
  test("ラベルで入力欄を探せて、補足を入力欄の説明として読み上げる", () => {
    render(
      <TextField
        description="管理画面で見分けるための名前"
        label="パスキーの名前"
        name="name"
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "パスキーの名前",
        description: "管理画面で見分けるための名前",
      }),
    ).toBeDefined();
  });

  test("補足が無ければ、説明を持たない", () => {
    render(<TextField label="パスキーの名前" name="name" />);

    expect(
      screen.getByRole("textbox", { name: "パスキーの名前", description: "" }),
    ).toBeDefined();
  });

  test("server が断った入力の知らせを、入力欄の説明として読み上げる", () => {
    render(
      <Form
        onSubmit={() => undefined}
        validationErrors={{ name: "この名前は使えません" }}
      >
        <TextField label="パスキーの名前" name="name" />
      </Form>,
    );

    expect(
      screen.getByRole("textbox", {
        name: "パスキーの名前",
        description: "この名前は使えません",
      }),
    ).toBeDefined();
  });
});
