import { describe, expect, test } from "bun:test";

import type { ImageRow } from "@/features/images/queries/images.query";
import { toAdminImage } from "@/features/images/to-admin-image";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const row = (change: Partial<ImageRow> = {}): ImageRow => ({
  id: "019b0000-0000-7000-8000-000000000000",
  title: null,
  description: null,
  alt: null,
  takenAt: null,
  takenAtOffsetMinutes: null,
  camera: null,
  lens: null,
  focalLength: null,
  fNumber: null,
  exposureTime: null,
  iso: null,
  publishedAt: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...change,
});

describe("toAdminImage", () => {
  test("撮影した日時を、時差を含まない ISO 8601 の形で返すこと", () => {
    expect(toAdminImage(row({ takenAt: "2025-05-01 14:03:27" })).takenAt).toBe(
      "2025-05-01T14:03:27",
    );
    expect(
      toAdminImage(row({ takenAt: "2025-05-01 14:03:27.25" })).takenAt,
    ).toBe("2025-05-01T14:03:27.25");
  });

  test.each([
    [540, "+09:00"],
    [0, "+00:00"],
    [-210, "-03:30"],
    [345, "+05:45"],
    [-1080, "-18:00"],
  ])("時差の %i 分を %s の形で返すこと", (minutes, offset) => {
    expect(
      toAdminImage(
        row({ takenAt: "2025-05-01 14:03:27", takenAtOffsetMinutes: minutes }),
      ).takenAtOffset,
    ).toBe(offset);
  });

  test("分からない撮影の情報は null のまま返し、公開した日時が無ければ公開していないと返すこと", () => {
    expect(toAdminImage(row())).toEqual({
      id: "019b0000-0000-7000-8000-000000000000",
      title: null,
      description: null,
      alt: null,
      takenAt: null,
      takenAtOffset: null,
      camera: null,
      lens: null,
      focalLength: null,
      fNumber: null,
      exposureTime: null,
      iso: null,
      published: false,
      publishedAt: null,
      createdAt: CREATED_AT.toISOString(),
      updatedAt: CREATED_AT.toISOString(),
    });
  });
});
