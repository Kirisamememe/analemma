import { expect, test } from "bun:test";

import {
  imageNeighborsQueryKey,
  loadImageNeighbors,
} from "../image-neighbors-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

test("ID の大文字・小文字によらず、同じ画像の前後を取得する", async () => {
  const server = createImageRoutes([{}, {}]);
  const [first, next] = server.images();

  if (first === undefined || next === undefined) {
    throw new Error("画像がありません");
  }

  const { api } = createFakeApi(server.routes);
  const id = first.id.toUpperCase();
  expect(imageNeighborsQueryKey(id)).toEqual(imageNeighborsQueryKey(first.id));
  expect(await loadImageNeighbors(api, id)).toEqual({
    _tag: "Succeeded",
    data: { newer: null, older: next.id },
  });
});
