import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { imageQueryKey } from "@/features/images/detail/queries/image-query";
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

const render = async (routes: FakeRoutes, onComplete?: () => void) => {
  const app = createTestApp({ path: "/images", routes });

  await app.router.load();

  const rendered = renderHook(() => usePhotoUploads(onComplete), {
    wrapper: withAppProviders(app),
  });

  return { ...rendered, history: app.history, queryClient: app.queryClient };
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

test("ログインの画面へ移るなら、確かめずに移り、次の写真を送らない", async () => {
  const held = holdUploads();
  const { result, history } = await render(held.routes);

  act(() => {
    result.current.add([photo("a.jpg"), photo("b.jpg")]);
  });

  history.push("/login");

  await waitFor(() => {
    expect(history.location.pathname).toBe("/login");
  });
  expect(result.current.leaving._tag).toBe("Idle");

  await held.answer();

  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.jpg: added",
      "b.jpg: waiting",
    ]);
  });
});

test("描き直しても、写真を足す・送り直す・閉じる関数は変わらない", async () => {
  const held = holdUploads();
  const { result, rerender } = await render(held.routes);
  const { add, retry, clear, track } = result.current;

  act(() => {
    result.current.add([photo("a.jpg")]);
  });
  rerender();

  expect(result.current.add).toBe(add);
  expect(result.current.retry).toBe(retry);
  expect(result.current.clear).toBe(clear);
  expect(result.current.track).toBe(track);
});

test("送っている間の入力は送信後も残り、保存せずに画面を離れる前に確かめる", async () => {
  const held = holdUploads();
  const { result, history } = await render(held.routes);

  act(() => {
    result.current.add([photo("a.jpg")]);
  });
  act(() => {
    result.current.metadata.change(1, { title: "朝の海" });
    result.current.metadata.finish();
  });
  expect(result.current.uploads).toHaveLength(1);
  await held.answer();

  await waitFor(() => {
    expect(result.current.uploads[0]?.status).toBe("added");
  });
  act(() => {
    history.push("/pages");
  });
  await waitFor(() => {
    expect(result.current.leaving._tag).toBe("Asking");
  });
  act(() => {
    result.current.leaving.stay();
  });
  expect(history.location.pathname).toBe("/images");
  expect(result.current.metadata.draft(1).title).toBe("朝の海");
  act(() => {
    result.current.metadata.finish();
  });
  await waitFor(() => {
    expect(result.current.uploads).toHaveLength(0);
  });
  expect(held.server.images()[0]?.title).toBe("朝の海");
});

test("保存中に離脱を確定したら、送信済みの写真をキャッシュに反映し、残りの変更を送らない", async () => {
  const server = createImageRoutes();
  const sent = Promise.withResolvers<string>();
  const resume = Promise.withResolvers<undefined>();
  const updates: string[] = [];
  const done = mock(() => undefined);

  const { result, history, queryClient } = await render(
    {
      ...server.routes,
      "admin/images/update": async (input) => {
        updates.push(input.id);
        sent.resolve(input.id);
        await resume.promise;

        return server.routes["admin/images/update"](input);
      },
    },
    done,
  );

  act(() => {
    result.current.add([photo("a.jpg"), photo("b.jpg")]);
  });
  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.jpg: added",
      "b.jpg: added",
    ]);
  });
  act(() => {
    result.current.metadata.change(1, { title: "朝" });
    result.current.metadata.change(2, { title: "夜" });
  });
  act(() => {
    result.current.metadata.finish();
  });
  const firstId = await sent.promise;
  const detail = imageQueryKey(firstId);
  queryClient.setQueryDefaults(detail, { gcTime: Infinity });
  queryClient.setQueryData(detail, {
    _tag: "Succeeded",
    data: server.images().find(({ id }) => id === firstId),
  });
  act(() => {
    history.push("/pages");
  });
  await waitFor(() => {
    expect(result.current.leaving._tag).toBe("Asking");
  });
  act(() => {
    result.current.leaving.leave();
  });
  resume.resolve(undefined);
  await waitFor(() => {
    expect(queryClient.getQueryData(detail)).toMatchObject({
      data: { title: "朝" },
    });
    expect(result.current.metadata.isSaving).toBe(false);
  });
  expect(updates).toEqual([firstId]);
  expect(done).not.toHaveBeenCalled();
});
