import { QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useApiPolling } from "@/api/server-state/use-api-polling";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

const KEY = ["admin", "images", "conversion", "a"] as const;
const POLL_MS = 10;

const setUp = (reply: (count: number) => string, seed?: string) => {
  let loads = 0;
  let renders = 0;

  const view = renderHook(
    (load: boolean) => {
      renders += 1;
      useApiPolling({
        key: KEY,
        ...(seed !== undefined && { seed }),
        every: (data) => (data === "done" ? false : POLL_MS),
        load: load
          ? () => {
              loads += 1;

              return Promise.resolve().then(() => reply(loads));
            }
          : undefined,
      });
    },
    { initialProps: true, wrapper: withQueryClient(new QueryClient()) },
  );

  return { ...view, loads: () => loads, renders: () => renders };
};

test("取得する関数が無い間は、取得しない", async () => {
  const { loads, rerender } = setUp(() => "waiting");

  rerender(false);

  const loaded = loads();

  await Bun.sleep(POLL_MS * 4);
  expect(loads()).toBe(loaded);
});

test("間隔を返す間は取り直し続け、取り直さないと決めたら止める", async () => {
  const { loads } = setUp((count) => (count < 3 ? "waiting" : "done"));

  await waitFor(() => {
    expect(loads()).toBe(3);
  });
  await Bun.sleep(POLL_MS * 4);
  expect(loads()).toBe(3);
});

test("取得に失敗しても、取得できるまで取り直し続ける", async () => {
  const { loads } = setUp((count) => {
    if (count < 4) throw new Error("通信が切れている");

    return "done";
  });

  await waitFor(() => {
    expect(loads()).toBe(4);
  });
  await Bun.sleep(POLL_MS * 4);
  expect(loads()).toBe(4);
});

test("最初の応答が届いても、内容が変わっても、失敗しても、呼ぶ側を再レンダリングしない", async () => {
  const { loads, renders } = setUp((count) => {
    if (count === 3 || count === 4) throw new Error("通信が切れている");

    return count < 6 ? `waiting ${count}` : "done";
  });

  const rendered = renders();

  await waitFor(() => {
    expect(loads()).toBe(6);
  });
  await Bun.sleep(POLL_MS * 2);
  expect(renders()).toBe(rendered);
});

test("取得済みのデータを渡すと、すぐには取得せず、1回分の間隔を待ってから取り直す", async () => {
  const { loads } = setUp(() => "done", "waiting");

  expect(loads()).toBe(0);
  await waitFor(() => {
    expect(loads()).toBe(1);
  });
  await Bun.sleep(POLL_MS * 4);
  expect(loads()).toBe(1);
});
