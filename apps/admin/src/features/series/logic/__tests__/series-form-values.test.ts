import { expect, test } from "bun:test";

import { checkSeriesField, seriesSaveFields } from "../series-form-values";

test("名前は1行に収まる文字列、slug は小文字と数字とハイフンで入力する", () => {
  expect(checkSeriesField("name", "旅の写真")).toBeUndefined();
  expect(checkSeriesField("name", "  ")).toBe("series.invalidName");
  expect(checkSeriesField("name", "春\n夏")).toBe("series.invalidName");
  expect(checkSeriesField("slug", "trip-2025")).toBeUndefined();
  expect(checkSeriesField("slug", "Trip 2025")).toBe(
    "fixedPageEditor.invalidSlug",
  );
});

test("説明は空でも複数行でも保存でき、長すぎる説明は知らせる", () => {
  const values = { name: "旅", slug: "trip", description: "  " };
  expect(checkSeriesField("description", values.description)).toBeUndefined();
  expect(seriesSaveFields(values)).toEqual({ ...values, description: null });

  const description = "  春\n夏  ";
  expect(checkSeriesField("description", description)).toBeUndefined();
  expect(seriesSaveFields({ ...values, description }).description).toBe(
    "春\n夏",
  );
  expect(checkSeriesField("description", "春".repeat(10_001))).toBe(
    "imageDetail.invalidDescription",
  );
});
