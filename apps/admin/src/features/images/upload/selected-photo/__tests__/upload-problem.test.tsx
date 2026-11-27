import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { UploadProblem } from "../upload-problem";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("保存の誤りが無ければ何も出さず、別の写真の誤りには、その写真を開く操作を添える", async () => {
  const show = mock((): void => undefined);

  const { rerender } = renderWithI18n(
    <UploadProblem problem={undefined} />,
    "ja",
  );

  expect(screen.queryByRole("alert")).toBeNull();

  rerender(
    <UploadProblem
      problem={{
        name: "lake.jpg",
        message: "imageDetail.saveFailed",
        show: undefined,
      }}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("lake.jpg");
  expect(screen.queryByRole("button")).toBeNull();

  rerender(
    <UploadProblem
      problem={{ name: "lake.jpg", message: "imageDetail.saveFailed", show }}
    />,
  );
  await userEvent.click(screen.getByRole("button"));
  expect(show).toHaveBeenCalledTimes(1);
});
