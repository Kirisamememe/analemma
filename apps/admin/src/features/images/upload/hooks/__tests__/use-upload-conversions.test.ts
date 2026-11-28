import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useUploadConversions } from "@/features/images/upload/hooks/use-upload-conversions";
import {
  type ConversionResult,
  withAdded,
} from "@/features/images/upload/logic/photo-conversions";
import {
  type PhotoUpload,
  queuePhotos,
} from "@/features/images/upload/logic/photo-uploads";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const POLL_MS = 20;

const setUp = async () => {
  const server = createImageRoutes([
    { title: "後", status: "processing" },
    { title: "先", status: "processing" },
  ]);

  const app = createTestApp({ path: "/", routes: server.routes });

  await app.router.load();

  const [later, earlier] = server.images();

  if (later === undefined || earlier === undefined) {
    throw new Error("画像が2枚必要です");
  }

  const queued = queuePhotos([], {
    files: [new File(["x"], "a.jpg"), new File(["x"], "b.jpg")],
    maxBytes: 10,
  });

  const uploads = withAdded(2, later)(withAdded(1, earlier)(queued));
  const onSettled = mock((_result: ConversionResult) => {});
  const gets = () => app.calls.filter((path) => path === "admin/images/get");

  return { server, app, earlier, later, uploads, onSettled, gets };
};

const render = (
  app: Awaited<ReturnType<typeof setUp>>["app"],
  props: Parameters<typeof useUploadConversions>[0],
) =>
  renderHook(
    (uploads: readonly PhotoUpload[]) => {
      useUploadConversions({ ...props, uploads });
    },
    { initialProps: props.uploads, wrapper: withAppProviders(app) },
  );

test("変換中の写真が無ければ、何も取り直さない", async () => {
  const { app, onSettled, gets } = await setUp();

  render(app, { uploads: [], onSettled, pollMs: POLL_MS });
  await Bun.sleep(POLL_MS * 4);

  expect(gets()).toEqual([]);
});

test("いちばん先に受け取られた変換中の写真を取り直し、変換を終えたら結果を渡す", async () => {
  const { server, app, earlier, uploads, onSettled, gets } = await setUp();

  render(app, { uploads, onSettled, pollMs: POLL_MS });
  await waitFor(() => {
    expect(gets().length).toBeGreaterThan(1);
  });
  expect(onSettled).not.toHaveBeenCalled();

  server.convert(earlier.id, { status: "published" });
  await waitFor(() => {
    expect(onSettled).toHaveBeenCalled();
  });
  expect(onSettled.mock.calls[0]).toMatchObject([
    { id: 1, imageId: earlier.id, image: { status: "published" } },
  ]);
});

test("取り直した画像が無くなっていたら、画像の無い結果を渡す", async () => {
  const { server, app, earlier, uploads, onSettled } = await setUp();

  server.routes["admin/images/delete"]({ id: earlier.id });
  render(app, { uploads, onSettled, pollMs: POLL_MS });

  await waitFor(() => {
    expect(onSettled).toHaveBeenCalled();
  });
  expect(onSettled.mock.calls[0]).toEqual([
    { id: 1, imageId: earlier.id, image: undefined },
  ]);
});

test("取り直しの最初の応答が届いても、取り直しが失敗し続けても、呼ぶ側を描き直さない", async () => {
  const { server, uploads, onSettled } = await setUp();
  const first = Promise.withResolvers<undefined>();
  let replies: "waiting" | "failing" = "waiting";
  let failed = 0;

  const app = createTestApp({
    path: "/",
    routes: {
      ...server.routes,
      "admin/images/get": (input) => {
        if (replies === "failing") {
          failed += 1;

          return { error: "INTERNAL_SERVER_ERROR", defined: false };
        }

        return first.promise.then(() =>
          server.routes["admin/images/get"](input),
        );
      },
    },
  });

  await app.router.load();

  const gets = () => app.calls.filter((path) => path === "admin/images/get");
  let renders = 0;

  renderHook(
    () => {
      renders += 1;
      useUploadConversions({ uploads, onSettled, pollMs: POLL_MS });
    },
    { wrapper: withAppProviders(app) },
  );
  await waitFor(() => {
    expect(gets()).toHaveLength(1);
  });

  const rendered = renders;

  first.resolve(undefined);
  await waitFor(() => {
    expect(gets().length).toBeGreaterThanOrEqual(2);
  });
  replies = "failing";
  await waitFor(() => {
    expect(failed).toBeGreaterThanOrEqual(3);
  });

  expect(renders).toBe(rendered);
  expect(onSettled).not.toHaveBeenCalled();
});
