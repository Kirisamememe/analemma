import {
  act,
  cleanup,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { useIssueDeployToken } from "@/features/deploy-tokens/issue/hooks/use-issue-deploy-token";
import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import { createTestApp } from "@/testing/create-test-app";
import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

describe("useIssueDeployToken", () => {
  test("発行した名前と token を返し、閉じたときに発行を知らせる", async () => {
    const server = createDeployTokenRoutes([]);

    const app = createTestApp({
      path: "/enroll",
      authenticator: createFakeAuthenticator(),
      routes: server.routes,
    });

    await app.router.load();
    const onClose = mock(() => undefined);

    const { result } = renderHook(() => useIssueDeployToken({ onClose }), {
      wrapper: withAppProviders(app),
    });

    act(() => {
      result.current.issue("本番");
    });
    await waitFor(() => {
      expect(result.current.issued?.name).toBe("本番");
    });
    const [issued] = server.tokens();
    expect(issued).toBeDefined();
    expect(result.current.issued?.token).toStartWith(`${issued?.id}.`);
    expect(screen.queryByRole("alert")).toBeNull();

    act(() => {
      result.current.close();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toBe(
      "「本番」を発行しました。",
    );
  });
});
