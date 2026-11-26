import { describe, expect, test } from "bun:test";

import { imageDescription, PHOTO_MAX_BYTES, photoFile } from "../image-values";

const fileOf = (size: number): File =>
  new File([new Uint8Array(size)], "photo.jpg");

describe("写真のファイル", () => {
  test("上限ちょうどの大きさまで受け、1 byte でも超えたら断ること", () => {
    expect(photoFile.safeParse(fileOf(PHOTO_MAX_BYTES)).success).toBe(true);
    expect(photoFile.safeParse(fileOf(PHOTO_MAX_BYTES + 1)).success).toBe(
      false,
    );
  });

  test("空のファイルは断ること", () => {
    expect(photoFile.safeParse(fileOf(0)).success).toBe(false);
  });
});

test("写真の説明は5,000文字まで受け、1文字でも超えたら断ること", () => {
  expect(imageDescription.safeParse("雪".repeat(5000)).success).toBe(true);
  expect(imageDescription.safeParse("雪".repeat(5001)).success).toBe(false);
});
