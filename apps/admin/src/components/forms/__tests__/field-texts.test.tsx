import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const SEASONS = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
];

type FormValues = {
  /** タイトル。 */
  title: string;
  /** 本文。 */
  body: string;
  /** 気温。 */
  temperature: number | null;
  /** 季節。 */
  season: string | null;
  /** 公開日。 */
  published: string | null;
  /** 同意したか。 */
  agreed: boolean;
};

const INITIAL: FormValues = {
  title: "",
  body: "",
  temperature: 4,
  season: null,
  published: "2024-02-01",
  agreed: false,
};

type ExampleProps = {
  /** どの入力欄も必須にするか。 */
  isRequired: boolean;
};

const Example = ({ isRequired }: ExampleProps): ReactNode => {
  const form = useAppForm({ defaultValues: INITIAL });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="title">
          {(field) => (
            <field.TextField isRequired={isRequired} label="タイトル" />
          )}
        </form.AppField>
        <form.AppField name="body">
          {(field) => <field.TextArea isRequired={isRequired} label="本文" />}
        </form.AppField>
        <form.AppField name="temperature">
          {(field) => (
            <field.NumberField isRequired={isRequired} label="気温" />
          )}
        </form.AppField>
        <form.AppField name="season">
          {(field) => (
            <field.Select
              isRequired={isRequired}
              label="季節"
              options={SEASONS}
            />
          )}
        </form.AppField>
        <form.AppField name="published">
          {(field) => (
            <field.DateField isRequired={isRequired} label="公開日" />
          )}
        </form.AppField>
        <form.AppField name="agreed">
          {(field) => (
            <field.Checkbox isRequired={isRequired} label="同意する" />
          )}
        </form.AppField>
        <button type="button">次へ</button>
      </form.Form>
    </form.AppForm>
  );
};

describe("field.* の部品が訳から渡す文言", () => {
  test("必須の入力欄は、6種とも、訳の「必須」を添え、入力を必須にする", () => {
    renderWithI18n(<Example isRequired />, "ja");

    expect(screen.getAllByText("必須")).toHaveLength(6);
    expect(
      [
        screen.getByRole("textbox", { name: "タイトル" }),
        screen.getByRole("textbox", { name: "本文" }),
        screen.getByRole("textbox", { name: "気温" }),
        screen.getByRole("checkbox", { name: "同意する" }),
      ].map((field) => field.getAttribute("aria-required")),
    ).toEqual(["true", "true", "true", "true"]);
  });

  test("必須でない入力欄には、「必須」を添えない", () => {
    renderWithI18n(<Example isRequired={false} />, "ja");

    expect(screen.queryByText("必須")).toBeNull();
    expect(
      screen
        .getByRole("textbox", { name: "タイトル" })
        .getAttribute("aria-required"),
    ).toBeNull();
  });

  test("言語を替えると、「必須」も、その言語の訳になる", () => {
    renderWithI18n(<Example isRequired />, "en");

    expect(screen.getAllByText("Required")).toHaveLength(6);
  });

  test("Select は、選ぶ前に訳の placeholder を出し、必須のときは「選択なし」を置かない", async () => {
    const user = userEvent.setup();

    renderWithI18n(<Example isRequired />, "ja");

    const select = screen.getByRole("button", { name: /季節/v });

    expect(select.textContent).toContain("選択してください");
    await user.click(select);
    expect(screen.getByRole("option", { name: "春" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "選択なし" })).toBeNull();
  });

  test("必須でない Select には、訳の「選択なし」を置く", async () => {
    const user = userEvent.setup();

    renderWithI18n(<Example isRequired={false} />, "ja");
    await user.click(screen.getByRole("button", { name: /季節/v }));

    expect(screen.getByRole("option", { name: "選択なし" })).toBeDefined();
  });

  test("NumberField の増減のボタンに、ラベルを入れた訳の名前を付け、名前どおりに値を増減する", async () => {
    const user = userEvent.setup();

    renderWithI18n(<Example isRequired={false} />, "ja");

    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "気温",
    });

    await user.click(screen.getByRole("button", { name: "気温の値を増やす" }));
    expect(input.value).toBe("5");
    await user.click(screen.getByRole("button", { name: "気温の値を減らす" }));
    expect(input.value).toBe("4");
  });

  test("DateField は、日付が未完のまま離れると、訳の知らせを出す", async () => {
    const user = userEvent.setup();

    renderWithI18n(<Example isRequired={false} />, "ja");
    await user.click(screen.getByRole("spinbutton", { name: /day.*公開日/iv }));
    await user.keyboard("{Backspace}");
    await user.click(screen.getByRole("button", { name: "次へ" }));

    expect(screen.getByText("年・月・日を入力してください。")).toBeDefined();
  });
});
