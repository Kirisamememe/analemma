import { expect, test } from "bun:test";

import { loadPages } from "../load-pages";

import { createFakeApi } from "@/testing/create-fake-api";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";

test("固定ページが無ければ空の一覧を返すこと", async () => {
  const { api } = createFakeApi(createFixedPageRoutes({}).routes);
  const result = await loadPages(api);

  expect(result.pages).toEqual([]);
});
