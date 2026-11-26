import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { imageQueryKey } from "@/features/images/detail/queries/image-query";
import { IMAGES_QUERY_KEY } from "@/features/images/queries/images-query";
import { usePhotoUploads } from "@/features/images/upload/hooks/use-photo-uploads";
import type { FakeRoutes } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const photo = (name: string): File =>
  new File(["x"], name, { type: name.endsWith(".bmp") ? "image/bmp" : "" });

type Outcome = "added" | "busy" | "expired";

const holdUploads = () => {
  const server = createImageRoutes();
  const waiting = new Map<string, PromiseWithResolvers<Outcome>>();
  let mostInFlight = 0;

  const routes: FakeRoutes = {
    ...server.routes,
    "admin/images/upload": async (input) => {
      const request = Promise.withResolvers<Outcome>();

      waiting.set(input.photo.name, request);
      mostInFlight = Math.max(mostInFlight, waiting.size);
      const outcome = await request.promise;
      waiting.delete(input.photo.name);

      if (outcome === "busy") {
        return { error: "SERVICE_UNAVAILABLE", defined: false } as const;
      }

      if (outcome === "expired") return { error: "UNAUTHORIZED" } as const;

      return server.routes["admin/images/upload"](input);
    },
  };

  const answer = async (
    name: string,
    outcome: Outcome = "added",
  ): Promise<void> => {
    await waitFor(() => {
      expect(waiting.has(name)).toBe(true);
    });
    waiting.get(name)?.resolve(outcome);
  };

  return { server, routes, answer, mostInFlight: () => mostInFlight };
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

test("2枚ずつ送り、後に選んだ写真が先に応答しても空いた枠で続け、503 になった写真を送り直せる", async () => {
  const held = holdUploads();
  const { result } = await render(held.routes);

  act(() => {
    result.current.add([photo("a.heic"), photo("b.bmp"), photo("c.jpg")]);
    result.current.add([photo("d.jpg")]);
  });
  expect(statuses(result.current.uploads)).toEqual([
    "a.heic: sending",
    "b.bmp: sending",
    "c.jpg: waiting",
    "d.jpg: waiting",
  ]);

  await held.answer("b.bmp");
  await held.answer("c.jpg", "busy");
  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.heic: sending",
      "b.bmp: unsupported",
      "c.jpg: failed",
      "d.jpg: sending",
    ]);
  });
  act(() => {
    result.current.retry(3);
    result.current.retry(3);
  });
  expect(result.current.uploads[2]?.status).toBe("waiting");
  await held.answer("d.jpg");
  await held.answer("c.jpg");
  await held.answer("a.heic");
  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.heic: added",
      "b.bmp: unsupported",
      "c.jpg: added",
      "d.jpg: added",
    ]);
  });
  expect(held.mostInFlight()).toBe(2);
  expect(held.server.images()).toHaveLength(3);
  act(() => {
    result.current.clear();
  });
  expect(result.current.uploads).toEqual([]);
});

test("先に登録した写真の応答が最後に届いても、一覧を server と同じ順に保つ", async () => {
  const server = createImageRoutes();
  const resume = Promise.withResolvers<undefined>();

  const { result, queryClient } = await render({
    ...server.routes,
    "admin/images/upload": async (input) => {
      const reply = server.routes["admin/images/upload"](input);

      if (input.photo.name === "a.jpg") await resume.promise;

      return reply;
    },
  });

  queryClient.setQueryDefaults(IMAGES_QUERY_KEY, { gcTime: Infinity });
  queryClient.setQueryData(IMAGES_QUERY_KEY, {
    pageParams: [undefined],
    pages: [{ images: [], nextCursor: null }],
  });
  act(() => {
    result.current.add([photo("a.jpg"), photo("b.jpg")]);
  });
  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.jpg: sending",
      "b.jpg: added",
    ]);
  });
  resume.resolve(undefined);
  await waitFor(() => {
    expect(queryClient.getQueryData(IMAGES_QUERY_KEY)).toMatchObject({
      pages: [{ images: server.images() }],
    });
  });
});

test("画面を離れたら、送信済みの2枚が完了しても待機中の写真を送らない", async () => {
  const held = holdUploads();
  const { result } = await render(held.routes);
  const stopTracking = result.current.track(document.createElement("section"));

  act(() => {
    result.current.add([photo("a.jpg"), photo("b.jpg"), photo("c.jpg")]);
  });
  stopTracking?.();
  await held.answer("b.jpg");
  await held.answer("a.jpg");
  await waitFor(() => {
    expect(statuses(result.current.uploads)).toEqual([
      "a.jpg: added",
      "b.jpg: added",
      "c.jpg: waiting",
    ]);
  });
});

test("並行して送った写真の1枚が401なら、もう1枚の成功後も待機中の写真を送らない", async () => {
  const held = holdUploads();
  const { result, history } = await render(held.routes);

  act(() => {
    result.current.add([photo("a.jpg"), photo("b.jpg"), photo("c.jpg")]);
  });
  await held.answer("b.jpg", "expired");
  await waitFor(() => {
    expect(history.location.pathname).toBe("/login");
  });
  await held.answer("a.jpg");
  await waitFor(() => {
    expect(result.current.uploads[0]?.status).toBe("added");
  });
  expect(result.current.leaving._tag).toBe("Idle");
  expect(result.current.uploads[2]?.status).toBe("waiting");
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
  await held.answer("a.jpg");

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
