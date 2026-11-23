import { describe, expect, test } from "bun:test";

import {
  hasUnsavedChanges,
  isValidImageText,
  toImageText,
  toUpdateInput,
} from "../image-text";

const EMPTY = { title: "", description: "", alt: "" };

describe("toImageText と toUpdateInput", () => {
  test("無い値は空の欄にし、空の欄は null で送る", () => {
    const values = toImageText({
      title: "夕暮れ",
      description: null,
      alt: null,
    });

    expect(values).toEqual({ title: "夕暮れ", description: "", alt: "" });
    expect(toUpdateInput(values)).toEqual({
      title: "夕暮れ",
      description: null,
      alt: null,
    });
  });

  test("前後の空白を落とし、空白だけの欄は空にする", () => {
    expect(
      toUpdateInput({ title: "  夕暮れ ", description: "\n\n", alt: " " }),
    ).toEqual({ title: "夕暮れ", description: null, alt: null });
  });
});

describe("isValidImageText", () => {
  test("空の欄は、どの欄でも送れる", () => {
    expect(isValidImageText("title", "")).toBe(true);
    expect(isValidImageText("alt", "   ")).toBe(true);
  });

  test("タイトルと alt は改行を、どの欄も長すぎる値を断る", () => {
    expect(isValidImageText("title", "夕暮れ\nの稜線")).toBe(false);
    expect(isValidImageText("alt", "山\n並み")).toBe(false);
    expect(isValidImageText("description", "一行目\n二行目")).toBe(true);
    expect(isValidImageText("title", "あ".repeat(200))).toBe(true);
    expect(isValidImageText("title", "あ".repeat(201))).toBe(false);
    expect(isValidImageText("alt", "あ".repeat(1001))).toBe(false);
    expect(isValidImageText("description", "あ".repeat(10_001))).toBe(false);
  });
});

describe("hasUnsavedChanges", () => {
  test("送る値が変わったときだけ、変更があるとする", () => {
    expect(
      hasUnsavedChanges({ saved: EMPTY, current: { ...EMPTY, alt: "  " } }),
    ).toBe(false);
    expect(
      hasUnsavedChanges({
        saved: { ...EMPTY, title: "夕暮れ" },
        current: { ...EMPTY, title: "夕暮れ " },
      }),
    ).toBe(false);
    expect(
      hasUnsavedChanges({ saved: EMPTY, current: { ...EMPTY, alt: "山" } }),
    ).toBe(true);
  });
});
