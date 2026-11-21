import { expect, test } from "bun:test";

/** 記事。 */
type Post = {
  /** 記事の題。 */
  readonly title: string;
  /** 記事の本文。 */
  readonly body: string;
};

const titleOf = (post: Post): string => post.title;

test("項目の一部だけを持つ作り物を、as で作れること", () => {
  expect(titleOf({ title: "題" } as Post)).toBe("題");
});

test("ループの中で、順に await できること", async () => {
  const seen: number[] = [];

  for (const value of [1, 2]) {
    seen.push(await Promise.resolve(value));
  }

  expect(seen).toEqual([1, 2]);
});
