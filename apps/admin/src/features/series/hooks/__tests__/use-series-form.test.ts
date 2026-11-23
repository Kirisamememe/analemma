import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useSeriesForm } from "../use-series-form";

import { createTestApp } from "@/testing/create-test-app";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("変更のあるフォームは閉じる前に確かめ、編集を続けて元の値に戻せば閉じる", async () => {
  const app = createTestApp({ path: "/enroll", routes: {} });
  await app.router.load();

  let closed = false;

  const { result } = renderHook(
    () =>
      useSeriesForm({
        onClose: () => {
          closed = true;
        },
      }),
    {
      wrapper: withAppProviders(app),
    },
  );

  act(() => {
    result.current.form.setFieldValue("name", "春");
    result.current.requestClose();
  });
  expect(result.current.confirmClose).toBe(true);
  expect(closed).toBe(false);

  act(() => {
    result.current.stay();
  });
  expect(result.current.form.state.values.name).toBe("春");
  expect(result.current.confirmClose).toBe(false);

  act(() => {
    result.current.form.setFieldValue("name", "");
    result.current.requestClose();
  });
  expect(closed).toBe(true);
});
