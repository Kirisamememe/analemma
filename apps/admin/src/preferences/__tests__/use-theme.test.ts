import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { THEME_STORAGE_KEY } from "@/preferences/storage-keys";
import { useTheme } from "@/preferences/use-theme";

beforeEach(() => {
  delete document.documentElement.dataset["theme"]; // ほかのテストの story が残す
});

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset["theme"];
  localStorage.clear();
});

describe("useTheme", () => {
  test("html に data-theme が無ければ、自動(OS に従う)を返す", () => {
    const { result } = renderHook(useTheme);

    expect(result.current.theme).toBe("system");
  });

  test("最初の描画の前に当てた配色を、今の配色として返す", () => {
    document.documentElement.dataset["theme"] = "dark";

    const { result } = renderHook(useTheme);

    expect(result.current.theme).toBe("dark");
  });

  test("選んだ配色を html に当て、localStorage に置き、今の配色を描き直す", async () => {
    const { result } = renderHook(useTheme);

    act(() => {
      result.current.changeTheme("light");
    });

    expect(document.documentElement.dataset["theme"]).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    await waitFor(() => {
      expect(result.current.theme).toBe("light");
    });

    act(() => {
      result.current.changeTheme("system");
    });

    expect(document.documentElement.dataset["theme"]).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    await waitFor(() => {
      expect(result.current.theme).toBe("system");
    });
  });

  test("html の data-theme をほかが書き換えても、今の配色を追う", async () => {
    const { result } = renderHook(useTheme);

    document.documentElement.dataset["theme"] = "dark";

    await waitFor(() => {
      expect(result.current.theme).toBe("dark");
    });
  });
});
