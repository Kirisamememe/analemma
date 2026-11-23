import { createBrowserHistory } from "@tanstack/react-router";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { createTestApp } from "@/testing/create-test-app";
import { withRouter } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async (needsConfirmation: () => boolean) => {
  const app = createTestApp({ path: "/login", routes: {} });
  await app.router.load();

  const { result } = renderHook(() => useLeaveConfirmation(needsConfirmation), {
    wrapper: withRouter(app.router),
  });

  return { ...app, result };
};

describe("useLeaveConfirmation", () => {
  test("確かめが要らなければ、止めずに移る", async () => {
    const { history, result } = await setUp(() => false);

    history.push("/enroll");

    await waitFor(() => {
      expect(history.location.pathname).toBe("/enroll");
    });
    expect(result.current._tag).toBe("Idle");
  });

  test("確かめが要れば、移動を止め、離れると決めたら移る", async () => {
    const { history, result } = await setUp(() => true);

    history.push("/enroll");

    await waitFor(() => {
      expect(result.current._tag).toBe("Asking");
    });
    expect(history.location.pathname).toBe("/login");

    act(() => {
      if (result.current._tag === "Asking") result.current.leave();
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/enroll");
    });
    expect(result.current._tag).toBe("Idle");
  });

  test("残ると決めたら、移らずに今の画面に残る", async () => {
    const { history, result } = await setUp(() => true);

    history.push("/enroll");
    await waitFor(() => {
      expect(result.current._tag).toBe("Asking");
    });

    act(() => {
      if (result.current._tag === "Asking") result.current.stay();
    });

    await waitFor(() => {
      expect(result.current._tag).toBe("Idle");
    });
    expect(history.location.pathname).toBe("/login");
  });

  test.each([
    [true, true],
    [false, false],
  ])(
    "確かめが要るか(%p)で、タブを閉じるときにブラウザに確かめさせるか(%p)を決める",
    (needed, prevented) => {
      const history = createBrowserHistory();
      const { router } = createTestApp({ path: "/", routes: {}, history });

      renderHook(() => useLeaveConfirmation(() => needed), {
        wrapper: withRouter(router),
      });

      const unload = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(unload);
      history.destroy();

      expect(unload.defaultPrevented).toBe(prevented);
    },
  );
});
