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

const renderForm = (isPending: boolean, submissions: Submissions) =>
  render(
    <Form isPending={isPending} onSubmit={submissions.onSubmit}>
      <TextField label="パスキーの名前" name="name" />
      <Button isPending={isPending} type="submit">
        登録
      </Button>
    </Form>,
  );

describe("Form", () => {
  test("入力欄で Enter を押すと、入力をまとめて送る", async () => {
    const submissions = recordSubmissions();

    renderForm(false, submissions);
    await userEvent.type(
      screen.getByRole("textbox", { name: "パスキーの名前" }),
      "MacBook{Enter}",
    );

    expect(submissions.names).toEqual(["MacBook"]);
  });

  test("送信中は、入力欄で Enter を押しても送り直さない", async () => {
    const submissions = recordSubmissions();

    renderForm(true, submissions);
    await userEvent.type(
      screen.getByRole("textbox", { name: "パスキーの名前" }),
      "MacBook{Enter}",
    );

    expect(submissions.names).toEqual([]);
  });
});
