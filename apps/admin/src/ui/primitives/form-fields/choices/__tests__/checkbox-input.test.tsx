import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { CheckboxInput } from "@/ui/primitives/form-fields/choices/checkbox-input";

afterEach(cleanup);

describe("CheckboxInput", () => {
  test("見えるラベルが無くても名前で探せて、Space で切り替えられること", async () => {
    const values: boolean[] = [];
    const user = userEvent.setup();
    render(
      <CheckboxInput
        aria-label="先頭に表示する"
        onChange={(selected) => {
          values.push(selected);
        }}
      />,
    );

    const checkbox = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "先頭に表示する",
    });
    expect(screen.queryByText("先頭に表示する")).toBeNull();
    await user.tab();
    await user.keyboard(" ");
    expect(checkbox.checked).toBe(true);
    expect(values).toEqual([true]);
  });
});
