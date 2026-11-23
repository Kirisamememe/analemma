import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

describe("DeployTokensSection", () => {
  test("取り消して行が消えたら、トークンの発行のボタンに focus を移す", async () => {
    const server = createDeployTokenRoutes([
      { name: "本番のデプロイ", lastUsedAt: null },
    ]);

    renderApp({ path: "/deploy-tokens", routes: server.routes });

    await userEvent.click(
      await screen.findByRole("button", { name: "取り消す" }),
    );

    const dialog = await screen.findByRole("dialog");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "取り消す" }),
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "トークンを発行" }),
      );
    });
  });
});
