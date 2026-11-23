import { QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider } from "@tanstack/react-router";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useLogOut } from "@/features/session/use-log-out";
import { createTestApp } from "@/testing/create-test-app";

type WrapperProps = {
  /** 描く部品。 */
  children: ReactNode;
};

afterEach(cleanup);

describe("useLogOut", () => {
  test("ログアウトを送り、server の状態を消して、ログインの画面に移る", async () => {
    const { calls, history, queryClient, router } = createTestApp({
      path: "/enroll",
      routes: { "admin/session/logOut": () => ({ output: undefined }) },
    });
    await router.load();
    queryClient.setQueryData(["passkeys"], []);
    const wrapper = ({ children }: WrapperProps): ReactNode => (
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>
          {children}
        </RouterContextProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(useLogOut, { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(history.location.href).toBe("/login");
    });
    expect(calls).toEqual(["admin/session/logOut"]);
    expect(queryClient.getQueryData(["passkeys"])).toBeUndefined();
  });
});
