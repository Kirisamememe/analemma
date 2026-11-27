import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { EnrollForm } from "../enroll-form";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("登録の結果に合わせて、知らせとログインへのリンクを出し分ける", () => {
  const submit = mock((_name: string): void => undefined);

  const { rerender } = renderWithI18n(
    <EnrollForm isPending={false} onSubmit={submit} outcome={undefined} />,
    "ja",
  );

  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();

  rerender(
    <EnrollForm
      isPending={false}
      onSubmit={submit}
      outcome="AlreadyRegistered"
    />,
  );

  expect(screen.getByRole("link").getAttribute("href")).toBe("/login");
});
