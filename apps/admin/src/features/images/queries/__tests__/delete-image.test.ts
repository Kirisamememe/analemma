import { expect, test } from "bun:test";

import { deleteImage } from "../delete-image";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

test("消して、もう無ければ NOT_FOUND を返す", async () => {
  const server = createImageRoutes([{ title: "夕暮れ" }]);
  const { api } = createFakeApi(server.routes);
  const id = server.images()[0]?.id ?? "";

  expect(await deleteImage(api, id)).toMatchObject({ _tag: "Succeeded" });
  expect(server.images()).toHaveLength(0);
  expect(await deleteImage(api, id)).toMatchObject({ code: "NOT_FOUND" });
});
