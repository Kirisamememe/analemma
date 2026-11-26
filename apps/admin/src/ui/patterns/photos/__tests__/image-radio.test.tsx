import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { ImageRadio } from "../image-radio";

afterEach(cleanup);

test("写真のタイトルを押すと選べ、選択済みの写真をラジオボタンで判別できる", async () => {
  const change = mock((): void => undefined);

  const photo = (checked: boolean) => (
    <label htmlFor="picture">
      湖
      <ImageRadio
        id="picture"
        checked={checked}
        name="photo"
        onChange={change}
      />
    </label>
  );

  const result = render(photo(false));
  await userEvent.click(screen.getByText("湖"));
  expect(change).toHaveBeenCalledTimes(1);
  result.rerender(photo(true));
  expect(
    screen.getByRole("radio", { name: "湖", checked: true }),
  ).toBeDefined();
});
