import { describe, expect, test } from "bun:test";

import {
  parseDeliveryImagePath,
  toDeliveryImagePath,
} from "@/features/images/delivery/delivery-image-path";

const ID = "019b0000-0000-7000-8000-00000000abcd";

describe("配信用の画像の path", () => {
  test("作った path から、同じ画像の ID と幅を読めること", () => {
    expect(toDeliveryImagePath(ID, 1707)).toBe(`/media/${ID}/1707.avif`);
    expect(parseDeliveryImagePath(toDeliveryImagePath(ID, 1707))).toEqual({
      imageId: ID,
      width: 1707,
    });
  });

  test.each([
    `/media/${ID.toUpperCase()}/640.avif`,
    `/media/${ID}/0.avif`,
    `/media/${ID}/0640.avif`,
    `/media/${ID}/100000.avif`,
    `/media/${ID}/640.webp`,
    `/media/${ID}/640.avif/`,
    `/media/${ID}/../640.avif`,
    `/media/${ID}/%36%34%30.avif`,
    `/media/${ID}x/640.avif`,
    `/images/${ID}/640.avif`,
    "/media/640.avif",
  ])("%p は読まないこと", (path) => {
    expect(parseDeliveryImagePath(path)).toBeUndefined();
  });
});
