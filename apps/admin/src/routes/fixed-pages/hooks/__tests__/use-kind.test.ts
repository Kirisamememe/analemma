import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useKind } from "../use-kind";

import { createTestApp } from "@/testing/create-test-app";
import { kind } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async (found: boolean) => {
  const app = createTestApp({
    path: "/",
    routes: {
      "admin/kinds/get": () =>
        found ? { output: kind } : { error: "NOT_FOUND" },
    },
  });

  await app.router.load();

  return app;
};

test("名前が無い間は、種類の定義を読まない", async () => {
  const app = await setUp(true);

  const { result } = renderHook(() => useKind(undefined), {
    wrapper: withAppProviders(app),
  });

  expect(result.current._tag).toBe("Loading");
  expect(app.calls).not.toContain("admin/kinds/get");
});

test("名前の種類の定義を読んで返し、種類が無ければ、無かったことを返す", async () => {
  const found = await setUp(true);

  const loaded = renderHook(() => useKind(kind.name), {
    wrapper: withAppProviders(found),
  });

  await waitFor(() => {
    expect(loaded.result.current).toMatchObject({
      _tag: "Loaded",
      data: { _tag: "Succeeded", data: kind },
    });
  });
  cleanup();

  const missing = await setUp(false);

  const gone = renderHook(() => useKind(kind.name), {
    wrapper: withAppProviders(missing),
  });

  await waitFor(() => {
    expect(gone.result.current).toMatchObject({
      _tag: "Loaded",
      data: { _tag: "Failed" },
    });
  });
});
