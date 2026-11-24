import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useKinds } from "../use-kinds";

import { createTestApp } from "@/testing/create-test-app";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("一覧と種類の選択が同時に読んでも、種類の一覧は一度だけ取得する", async () => {
  const server = createFixedPageRoutes({ kinds: [kind], pages: [] });
  const app = createTestApp({ path: "/enroll", routes: server.routes });
  await app.router.load();

  const { result } = renderHook(() => [useKinds(), useKinds()], {
    wrapper: withAppProviders(app),
  });

  await waitFor(() => {
    expect(result.current.map((query) => query._tag)).toEqual([
      "Loaded",
      "Loaded",
    ]);
  });
  expect(app.calls.filter((path) => path === "admin/kinds/list")).toHaveLength(
    1,
  );
});
