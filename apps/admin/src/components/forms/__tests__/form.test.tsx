import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";

const DESCRIPTION = "ページの見出しに使います";
const MISSING_TITLE = "タイトルを入力してください";
const TAKEN_TITLE = "このタイトルはすでに使われています";

type FormCaseProps = {
  /** フォームから送ったタイトルを受け取る関数。 */
  readonly onSubmit: (title: string) => undefined | Promise<void>;
};

const FormCase = ({ onSubmit }: FormCaseProps): ReactNode => {
  const form = useAppForm({
    defaultValues: { title: "" },
    validators: {
      onSubmitAsync: ({ value }) =>
        Promise.resolve(
          value.title === "お知らせ"
            ? { fields: { title: TAKEN_TITLE } }
            : undefined,
        ),
    },
    onSubmit: ({ value }) => onSubmit(value.title),
  });

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Form
          isPending={isSubmitting}
          onSubmit={() => {
            void form.handleSubmit();
          }}
        >
          <form.AppField
            name="title"
            validators={{
              onBlur: ({ value }) =>
                value.trim() === "" ? MISSING_TITLE : undefined,
            }}
          >
            {(field) => (
              <field.TextField
                description={DESCRIPTION}
                isRequired
                label="タイトル"
              />
            )}
          </form.AppField>
          <Button isPending={isSubmitting} type="submit">
            保存
          </Button>
        </Form>
      )}
    </form.Subscribe>
  );
};

afterEach(cleanup);

describe("TanStack Form の TextField", () => {
  test("focus が外れると空欄の誤りが出て、値を直すと Enter で送れること", async () => {
    const onSubmit = mock((_title: string) => undefined);

    renderWithI18n(<FormCase onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", {
      name: "タイトル",
      description: DESCRIPTION,
    });

    expect(screen.queryByText(MISSING_TITLE)).toBeNull();

    await userEvent.click(input);
    await userEvent.tab();

    expect(
      screen
        .getByRole("textbox", {
          name: "タイトル",
          description: `${DESCRIPTION} ${MISSING_TITLE}`,
        })
        .getAttribute("aria-invalid"),
    ).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(input, "更新履歴{Enter}");
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("更新履歴");
    });
    expect(screen.queryByText(MISSING_TITLE)).toBeNull();
  });

  test("送信時の外部エラーを入力欄に結び付け、値を直すと再送できること", async () => {
    const onSubmit = mock((_title: string) => undefined);

    renderWithI18n(<FormCase onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "タイトル" });

    await userEvent.type(input, "お知らせ{Enter}");

    const invalidInput = await screen.findByRole("textbox", {
      name: "タイトル",
      description: `${DESCRIPTION} ${TAKEN_TITLE}`,
    });
    expect(invalidInput.getAttribute("aria-invalid")).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.clear(input);
    await userEvent.type(input, "更新履歴");

    expect(screen.queryByText(TAKEN_TITLE)).toBeNull();
    expect(
      screen
        .getByRole("textbox", { name: "タイトル", description: DESCRIPTION })
        .getAttribute("aria-invalid"),
    ).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("更新履歴");
    });
  });

  test("送信中に入力欄で Enter を押しても送り直さないこと", async () => {
    const submission = Promise.withResolvers<undefined>();
    const onSubmit = mock((_title: string) => submission.promise);

    renderWithI18n(<FormCase onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "タイトル" });

    await userEvent.type(input, "更新履歴{Enter}");
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    await userEvent.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    submission.resolve(undefined);
    await screen.findByRole("button", { name: "保存" });
  });
});
