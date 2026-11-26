import { expect, test } from "bun:test";

import { saveUploadMetadata } from "../save-upload-metadata";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

test("現在の説明と alt を保ち、入力したタイトルの前後の空白を除いて保存する", async () => {
  const server = createImageRoutes([
    { description: "海から吹く風", alt: "朝の浜辺" },
  ]);

  const { api } = createFakeApi(server.routes);
  const [image] = server.images();

  if (image === undefined) throw new Error("画像がありません");

  expect(
    await saveUploadMetadata(api, {
      imageId: image.id,
      changes: { title: " 朝 " },
    }),
  ).toMatchObject({
    _tag: "Saved",
    image: { title: "朝", description: "海から吹く風", alt: "朝の浜辺" },
  });
});

test("画像が消えていたら書き換えずに NotFound を返す", async () => {
  const { api, calls } = createFakeApi(createImageRoutes().routes);

  expect(
    await saveUploadMetadata(api, {
      imageId: "019b0000-0000-7000-8000-0000000000ff",
      changes: { title: "朝" },
    }),
  ).toEqual({ _tag: "NotFound" });
  expect(calls).toEqual(["admin/images/get"]);
});
