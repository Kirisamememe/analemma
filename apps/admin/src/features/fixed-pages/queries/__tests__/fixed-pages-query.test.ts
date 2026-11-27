import { expect, test } from "bun:test";

import {
  loadFixedPages,
  loadKind,
  loadKinds,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { createFakeApi } from "@/testing/create-fake-api";
import { kind } from "@/testing/fixed-page-samples";

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

test("保存済みの中身を表せない種類の定義は、読めなかったことにする", async () => {
  const { api } = createFakeApi({
    "admin/kinds/get": () => ({ output: kind }),
  });

  expect(
    await loadKind(api, { name: kind.name, fits: () => true }),
  ).toMatchObject({ _tag: "Succeeded", data: { name: kind.name } });
  expect(loadKind(api, { name: kind.name, fits: () => false })).rejects.toThrow(
    "種類の定義で保存済みの中身を編集できません",
  );
});
