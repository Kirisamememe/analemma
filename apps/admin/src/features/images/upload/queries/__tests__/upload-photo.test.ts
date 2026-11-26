import { describe, expect, test } from "bun:test";

import { uploadPhoto } from "../upload-photo";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

describe("uploadPhoto", () => {
  test("写真から作った画像を返し、受けない形式は Unsupported にする", async () => {
    const { api } = createFakeApi(createImageRoutes([]).routes);

    const added = await uploadPhoto(
      api,
      new File(["x"], "a.jpg", { type: "image/jpeg" }),
    );

    expect(added).toMatchObject({ _tag: "Added", image: { published: true } });
    expect(
      await uploadPhoto(api, new File(["x"], "a.bmp", { type: "image/bmp" })),
    ).toEqual({ _tag: "Unsupported" });
  });

  test("セッションが切れていたら SessionExpired と元の失敗を返す", async () => {
    const { api } = createFakeApi({
      ...createImageRoutes([]).routes,
      "admin/images/upload": () => ({ error: "UNAUTHORIZED" }),
    });

    expect(
      await uploadPhoto(api, new File(["x"], "a.jpg", { type: "image/jpeg" })),
    ).toMatchObject({
      _tag: "SessionExpired",
      error: { code: "UNAUTHORIZED" },
    });
  });
});
