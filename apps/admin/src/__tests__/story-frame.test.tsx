import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { StoryFrame } from "../../.storybook/story-frame";

afterEach(cleanup);

const StoryCounter = (): ReactNode => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => {
        setCount(count + 1);
      }}
      type="button"
    >
      {t("enroll.submit")} {count}
    </button>
  );
};

test("ツールバーの言語を切り替えると、story の訳が変わり、子の state が残る", async () => {
  const story = <StoryCounter />;

  const { rerender } = render(
    <StoryFrame contentLang={undefined} locale="ja" theme="light">
      {story}
    </StoryFrame>,
  );

  await userEvent.click(
    screen.getByRole("button", { name: "パスキーを登録 0" }),
  );

  rerender(
    <StoryFrame contentLang={undefined} locale="en" theme="light">
      {story}
    </StoryFrame>,
  );

  expect(
    screen.getByRole("button", { name: "Register the passkey 1" }),
  ).toBeDefined();
});
