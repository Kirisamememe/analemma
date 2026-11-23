import { expect, test } from "bun:test";

import {
  loadFixedPages,
  loadKinds,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { createFakeApi } from "@/testing/create-fake-api";

test("固定ページの一覧を server から読むこと", async () => {
  const { api, calls } = createFakeApi({
    "admin/fixedPages/list": () => ({ output: { pages: [] } }),
  });

  expect(await loadFixedPages(api)).toEqual({ pages: [] });
  expect(calls).toEqual(["admin/fixedPages/list"]);
});

test("種類の一覧を server から読むこと", async () => {
  const { api, calls } = createFakeApi({
    "admin/kinds/list": () => ({ output: { kinds: [] } }),
  });

  expect(await loadKinds(api)).toEqual({ kinds: [] });
  expect(calls).toEqual(["admin/kinds/list"]);
});
