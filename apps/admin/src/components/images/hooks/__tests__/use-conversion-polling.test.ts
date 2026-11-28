import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useConversionPolling } from "@/components/images/hooks/use-conversion-polling";
import { imageQueryKey, type LoadedImage } from "@/queries/image-query";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const POLL_MS = 20;

const setUp = async () => {
  const server = createImageRoutes([{ title: "港", status: "processing" }]);
  const app = createTestApp({ path: "/", routes: server.routes });
  const [image] = server.images();

  if (image === undefined) throw new Error("画像がありません");

  await app.router.load();

  const key = imageQueryKey(image.id);

  app.queryClient.setQueryDefaults(key, { gcTime: Infinity });

  const gets = () => app.calls.filter((path) => path === "admin/images/get");
  const loaded = () => app.queryClient.getQueryData<LoadedImage>(key);

  const seed = (data: typeof image): void => {
    const seeded: LoadedImage = { _tag: "Succeeded", data };

    app.queryClient.setQueryData(key, seeded);
  };

  const poll = (id: string | null) =>
    renderHook(
      (current: string | null) => {
        useConversionPolling(current, POLL_MS);
      },
      { initialProps: id, wrapper: withAppProviders(app) },
    );

  return { server, image, gets, loaded, seed, poll };
};

test("画像の ID が無い間は、取り直さない", async () => {
  const { gets, poll } = await setUp();

  poll(null);
  await Bun.sleep(POLL_MS * 4);

  expect(gets()).toEqual([]);
});

test("変換を終えるまで取り直し、終えたら取り直しを止める", async () => {
  const { server, image, gets, poll } = await setUp();

  poll(image.id);
  await waitFor(() => {
    expect(gets().length).toBeGreaterThan(2);
  });

  server.convert(image.id, { status: "published" });
  await Bun.sleep(POLL_MS * 4);

  const settled = gets().length;

  await Bun.sleep(POLL_MS * 4);
  expect(gets()).toHaveLength(settled);
});

test("変換を終えたら、読み込んだ画像の状態だけを差し替え、保存したタイトルを古い値に戻さない", async () => {
  const { server, image, loaded, seed, poll } = await setUp();

  seed({ ...image, title: "保存したタイトル" });

  const before = loaded();

  poll(image.id);
  await Bun.sleep(POLL_MS * 4);
  expect(loaded()).toBe(before);

  server.convert(image.id, { status: "published" });
  await waitFor(() => {
    expect(loaded()).toMatchObject({
      data: { title: "保存したタイトル", status: "published" },
    });
  });
});

test("読み込んでいない画像は、取り直しても読み込んだことにしない", async () => {
  const { server, image, loaded, gets, poll } = await setUp();

  server.convert(image.id, { status: "published" });
  poll(image.id);
  await waitFor(() => {
    expect(gets()).toHaveLength(1);
  });
  await Bun.sleep(POLL_MS * 2);

  expect(loaded()).toBeUndefined();
});

test("取り直した画像が無くなっていたら、読み込んだ画像を無いという結果に替え、取り直しを止める", async () => {
  const { server, image, loaded, gets, seed, poll } = await setUp();

  seed(image);
  server.routes["admin/images/delete"]({ id: image.id });
  poll(image.id);

  await waitFor(() => {
    expect(loaded()).toMatchObject({ _tag: "Failed", code: "NOT_FOUND" });
  });

  const settled = gets().length;

  await Bun.sleep(POLL_MS * 4);
  expect(gets()).toHaveLength(settled);
});
