import { ORPCError } from "@orpc/client";
import { QueryObserver, onlineManager } from "@tanstack/react-query";
import { describe, expect, test } from "bun:test";

import { createQueryClient } from "@/api/create-query-client";

/** セッションが無いと知らされた回数を数えるもの。 */
type Counter = {
  /** 知らされた回数。 */
  readonly count: () => number;
  /** query client に渡す関数。 */
  readonly onUnauthorized: () => void;
};

const countCalls = (): Counter => {
  let calls = 0;

  return {
    count: () => calls,
    onUnauthorized: () => {
      calls += 1;
    },
  };
};

describe("createQueryClient", () => {
  test("取得がセッションの無いことを返したら、やり直さずに知らせる", async () => {
    const counter = countCalls();
    const queryClient = createQueryClient(counter);
    let attempts = 0;

    await queryClient
      .query({
        queryKey: ["session"],
        queryFn: () => {
          attempts += 1;

          return Promise.reject(new ORPCError("UNAUTHORIZED"));
        },
        retryDelay: 0,
      })
      .catch(() => undefined);

    expect(attempts).toBe(1);
    expect(counter.count()).toBe(1);
  });

  test("送信がセッションの無いことを返したら、知らせる", async () => {
    const counter = countCalls();
    const queryClient = createQueryClient(counter);

    await queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationFn: () => Promise.reject(new ORPCError("UNAUTHORIZED")),
      })
      .execute(undefined)
      .catch(() => undefined);

    expect(counter.count()).toBe(1);
  });

  test("ほかの失敗では知らせない", async () => {
    const counter = countCalls();
    const queryClient = createQueryClient(counter);

    await queryClient
      .query({
        queryKey: ["pages"],
        queryFn: () => Promise.reject(new ORPCError("NOT_FOUND")),
        retry: false,
      })
      .catch(() => undefined);

    expect(counter.count()).toBe(0);
  });

  test("使う画面の無い取得は、終えたらすぐに捨てる", async () => {
    const queryClient = createQueryClient(countCalls());
    const key = ["admin", "passkeys", "list"];

    await queryClient.query({
      queryKey: key,
      queryFn: () => Promise.resolve(["MacBook"]),
    });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(queryClient.getQueryData(key)).toBeUndefined();
  });

  test("使う画面が無くなった取得は、取得の途中でも捨てる", async () => {
    const queryClient = createQueryClient(countCalls());
    const key = ["admin", "fixedPages", "list"];
    const response = Promise.withResolvers<string[]>();

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => response.promise,
    });

    const unsubscribe = observer.subscribe(() => undefined);

    expect(queryClient.isFetching({ queryKey: key })).toBe(1);

    unsubscribe();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(queryClient.getQueryCache().find({ queryKey: key })).toBeUndefined();
    expect(queryClient.isFetching()).toBe(0);
    response.resolve(["about"]);
  });

  test("使う画面がすぐに付け直された取得は、捨てない", async () => {
    const queryClient = createQueryClient(countCalls());
    const key = ["admin", "fixedPages", "list"];

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => Promise.resolve(["about"]),
    });

    observer.subscribe(() => undefined)();
    const unsubscribe = observer.subscribe(() => undefined);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(queryClient.getQueryData(key)).toEqual(["about"]);
    unsubscribe();
  });

  test("使う画面の無い送信の結果は、終えたらすぐに捨てる", async () => {
    const queryClient = createQueryClient(countCalls());

    await queryClient
      .getMutationCache()
      .build(queryClient, { mutationFn: () => Promise.resolve("token") })
      .execute(undefined);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(queryClient.getMutationCache().getAll()).toEqual([]);
  });

  test("画面に focus が戻っても、取り直さない", () => {
    const queryClient = createQueryClient(countCalls());

    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(
      false,
    );
  });

  test("オフラインでも送信を保留せず、その場で送って失敗を返す", async () => {
    const queryClient = createQueryClient(countCalls());
    let sent = 0;

    onlineManager.setOnline(false);

    try {
      await queryClient
        .getMutationCache()
        .build(queryClient, {
          mutationFn: () => {
            sent += 1;

            return Promise.reject(new TypeError("Failed to fetch"));
          },
        })
        .execute(undefined)
        .catch(() => undefined);
    } finally {
      onlineManager.setOnline(true);
    }

    expect(sent).toBe(1);
  });

  test("オフラインでも取得を保留せず、その場で取りに行く", async () => {
    const queryClient = createQueryClient(countCalls());
    let fetched = 0;

    onlineManager.setOnline(false);

    try {
      await queryClient
        .query({
          queryKey: ["passkeys"],
          queryFn: () => {
            fetched += 1;

            return Promise.reject(new TypeError("Failed to fetch"));
          },
          retry: false,
        })
        .catch(() => undefined);
    } finally {
      onlineManager.setOnline(true);
    }

    expect(fetched).toBe(1);
  });
});
