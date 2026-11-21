import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { Button } from "../button";
import { Form } from "../form";
import { TextField } from "../text-field";

afterEach(cleanup);

/** 送った入力を覚えるもの。 */
type Submissions = {
  /** 送った名前の並び。 */
  readonly names: string[];
  /** Form に渡す関数。 */
  readonly onSubmit: (data: FormData) => void;
};

const recordSubmissions = (): Submissions => {
  const names: string[] = [];

  return {
    names,
    onSubmit: (data) => {
      const name = data.get("name");

      names.push(typeof name === "string" ? name : "");
    },
  };
};

const NO_ERRORS: Readonly<Record<string, string>> = {};

/** フォームを描くときの条件。 */
type FormCase = {
  /** 送信中か。 */
  readonly isPending?: boolean;
  /** 入力が要るか。 */
  readonly isRequired?: boolean;
  /** server が断った入力ごとの知らせ。 */
  readonly validationErrors?: Readonly<Record<string, string>>;
};

const renderForm = (
  submissions: Submissions,
  { isPending = false, isRequired = false, validationErrors }: FormCase = {},
) =>
  render(
    <Form
      isPending={isPending}
      onSubmit={submissions.onSubmit}
      validationErrors={validationErrors ?? NO_ERRORS}
    >
      <TextField isRequired={isRequired} label="パスキーの名前" name="name" />
      <Button isPending={isPending} type="submit">
        登録
      </Button>
    </Form>,
  );

describe("Form", () => {
  test("入力欄で Enter を押すと、入力をまとめて送る", async () => {
    const submissions = recordSubmissions();

    renderForm(submissions);
    await userEvent.type(
      screen.getByRole("textbox", { name: "パスキーの名前" }),
      "MacBook{Enter}",
    );

    expect(submissions.names).toEqual(["MacBook"]);
  });

  test("送信中は、入力欄で Enter を押しても送り直さない", async () => {
    const submissions = recordSubmissions();

    renderForm(submissions, { isPending: true });
    await userEvent.type(
      screen.getByRole("textbox", { name: "パスキーの名前" }),
      "MacBook{Enter}",
    );

    expect(submissions.names).toEqual([]);
  });

  test("送信中は、送信のボタンを押しても、Enter・Space でも送らない", async () => {
    const submissions = recordSubmissions();

    renderForm(submissions, { isPending: true });

    const button = screen.getByRole("button", { name: /登録/v });

    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(submissions.names).toEqual([]);
  });

  test("入力が要る欄が空なら、送らない", async () => {
    const submissions = recordSubmissions();

    renderForm(submissions, { isRequired: true });
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    expect(submissions.names).toEqual([]);
  });

  test("server が断った入力を直すと、知らせが消え、送り直せる", async () => {
    const submissions = recordSubmissions();

    renderForm(submissions, {
      validationErrors: { name: "この名前は使えません" },
    });

    const field = screen.getByRole("textbox", { name: "パスキーの名前" });

    expect(screen.getByText("この名前は使えません")).toBeDefined();

    await userEvent.type(field, "MacBook");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));

    expect(screen.queryByText("この名前は使えません")).toBeNull();
    expect(submissions.names).toEqual(["MacBook"]);
  });
});
