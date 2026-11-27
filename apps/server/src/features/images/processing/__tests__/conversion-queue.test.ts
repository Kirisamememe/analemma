import { describe, expect, test } from "bun:test";

import { createConversionQueue } from "@/features/images/processing/conversion-queue";

describe("写真の変換のキュー", () => {
  test("前の変換が終わるまで、次の変換を始めないこと", async () => {
    const queue = createConversionQueue();
    const steps: string[] = [];
    const first = Promise.withResolvers<undefined>();

    const firstResult = queue.run(async () => {
      steps.push("1 を始めた");
      await first.promise;
      steps.push("1 が終わった");

      return 1;
    });

    const secondResult = queue.run(() => {
      steps.push("2 を始めた");

      return Promise.resolve(2);
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    expect(steps).toEqual(["1 を始めた"]);

    first.resolve(undefined);

    expect(await Promise.all([firstResult, secondResult])).toEqual([1, 2]);
    expect(steps).toEqual(["1 を始めた", "1 が終わった", "2 を始めた"]);
  });

  test("前の変換が失敗しても、その失敗を渡したうえで、次の変換を流すこと", async () => {
    const queue = createConversionQueue();

    const failed = queue.run(() => Promise.reject(new Error("壊れた写真")));
    const next = queue.run(() => Promise.resolve("次の写真"));

    expect(await Promise.allSettled([failed, next])).toEqual([
      { status: "rejected", reason: new Error("壊れた写真") },
      { status: "fulfilled", value: "次の写真" },
    ]);
  });
});
