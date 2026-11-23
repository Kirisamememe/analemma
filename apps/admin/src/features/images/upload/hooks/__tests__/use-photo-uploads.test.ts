import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { usePhotoUploads } from "@/features/images/upload/hooks/use-photo-uploads";
import type { FakeRoutes } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const photo = (name: string): File =>
  new File(["x"], name, { type: name.endsWith(".bmp") ? "image/bmp" : "" });

/** 次の応答の決め方。 */
type Answer = {
  /** 送れなかったことにするか。 */
  readonly fail?: boolean;
};

/** 写真を送る procedure を、テストから1回ずつ答えさせる作り物。 */
const holdUploads = () => {
  const server = createImageRoutes([]);
  const upload = server.routes["admin/images/upload"];
  const waiting: (() => void)[] = [];
  let inFlight = 0;
  let mostInFlight = 0;
  let failNext = false;

  const routes: FakeRoutes = {
    ...server.routes,
    "admin/images/upload": async (input) => {
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);

      const { promise, resolve } = Promise.withResolvers<undefined>();

      waiting.push(() => {
        resolve(undefined);
      });
      await promise;
      inFlight -= 1;

      if (failNext) {
        failNext = false;

        return { error: "INTERNAL_SERVER_ERROR", defined: false } as const;
      }

      return upload(input);
    },
  };

  return {
    server,
    routes,
    answer: async (options: Answer = {}): Promise<void> => {
      await waitFor(() => {
        expect(waiting).toHaveLength(1);
      });
      failNext = options.fail === true;
      waiting.shift()?.();
    },
    mostInFlight: () => mostInFlight,
  };
};

const render = async (routes: FakeRoutes) => {
  const app = createTestApp({ path: "/images", routes });

  await app.router.load();

  return renderHook(() => usePhotoUploads(), {
    wrapper: withAppProviders(app),
  });
};

const statuses = (
  uploads: ReturnType<typeof usePhotoUploads>["uploads"],
): string[] => uploads.map(({ file, status }) => `${file.name}: ${status}`);

test("選んだ写真を1枚ずつ送り、結果を写真ごとに示し、送れなかった写真だけを送り直せる", async () => {
  const held = holdUploads();
  const { result } = await render(held.routes);

  act(() => {
    result.current.add([photo("a.heic"), photo("b.bmp"), photo("c.jpg")]);
  });

  expect(statuses(result.current.uploads)).toEqual([
    "a.heic: sending",
    "b.bmp: waiting",
    "c.jpg: waiting",
  ]);

  await held.answer();
  await held.answer();
  await held.answer({ fail: true });

  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.heic: added",
      "b.bmp: unsupported",
      "c.jpg: failed",
    ]);
  });
  expect(held.mostInFlight()).toBe(1);

  act(() => {
    result.current.retry(3);
  });
  await held.answer();

  await waitFor(() => {
    expect(statuses(result.current.uploads)).toContain("c.jpg: added");
  });
  expect(held.server.images()).toHaveLength(2);

  act(() => {
    result.current.clear();
  });
  expect(result.current.uploads).toEqual([]);
});

test("画面を離れた後は、次の写真を送らない", async () => {
  const held = holdUploads();
  const { result } = await render(held.routes);
  const stopTracking = result.current.track(document.createElement("section"));

  act(() => {
    result.current.add([photo("a.jpg"), photo("b.jpg")]);
  });

  stopTracking?.();
  await held.answer();

  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.jpg: added",
      "b.jpg: waiting",
    ]);
  });
  expect(held.server.images()).toHaveLength(1);
});
