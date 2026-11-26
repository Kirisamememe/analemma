import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { usePhotoPreview } from "../use-photo-preview";

describe("usePhotoPreview", () => {
  test("写真を差し替えると、それまでの読み込み失敗を引き継がない", () => {
    const { result, rerender } = renderHook(
      ({ source }) => usePhotoPreview(source, "/media/preview.avif"),
      { initialProps: { source: "/media/one.avif" } },
    );

    act(() => {
      result.current?.onError();
    });
    expect(result.current?.src).toBe("/media/preview.avif");
    act(() => {
      result.current?.onError();
    });
    expect(result.current).toBeUndefined();
    rerender({ source: "/media/two.avif" });
    expect(result.current?.src).toBe("/media/two.avif");
  });
});
