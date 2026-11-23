import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { imageQueryKey } from "@/features/images/detail/queries/image-query";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

afterEach(cleanup);

const open = () => {
  const server = createImageRoutes(SAMPLE_IMAGES);
  const [first, second] = server.images();

  if (first === undefined || second === undefined) {
    throw new Error("画像が2枚必要です");
  }

  const app = renderApp({ path: "/images/" + first.id, routes: server.routes });

  return { server, first, second, ...app };
};

describe("写真を送るときの表示", () => {
  test("次の写真を読み込むまで元の写真と情報を保ち、読み終えた img をそのまま表示する", async () => {
    const { first, second, history } = open();
    const panel = await screen.findByRole("complementary");
    const old = screen.getByRole("img", { name: first.alt ?? "" });
    fireEvent.load(old);
    const title = within(panel).getByRole("heading", { level: 1 });
    const forward = await screen.findByRole("link", { name: "次の画像" });
    forward.focus();
    await userEvent.keyboard("{Enter}");

    const next = await screen.findByAltText(
      second.alt ?? second.title ?? "無題の画像",
    );

    expect(old.isConnected).toBe(true);
    expect(within(panel).getByRole("heading", { level: 1 }).textContent).toBe(
      title.textContent,
    );
    expect(screen.getByRole("link", { name: "次の画像" })).toBe(forward);
    expect(forward.getAttribute("aria-disabled")).toBe("true");
    expect(forward.hasAttribute("href")).toBe(false);
    await userEvent.keyboard("{Enter}");
    await userEvent.click(forward);
    expect(history.location.pathname).toBe("/images/" + second.id);
    panel.scrollTop = 120;

    fireEvent.load(next);
    expect(screen.getByRole("img", { name: "無題の画像" })).toBe(next);
    expect(screen.getByRole("complementary")).toBe(panel);
    expect(within(panel).getByRole("heading", { level: 1 }).textContent).toBe(
      "無題の画像",
    );
    expect(panel.scrollTop).toBe(0);
    expect(document.activeElement).toBe(forward);
    expect(forward.getAttribute("aria-disabled")).toBeNull();
  });

  test("編集している画像を取り直せなくても入力が残り、変更を破棄して別の画像に移ると Dialog を閉じる", async () => {
    const { server, first, second, queryClient, history } = open();
    queryClient.setQueryDefaults(imageQueryKey(first.id), { retry: false });
    await userEvent.click(await screen.findByRole("button", { name: "編集" }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByRole("textbox", { name: "タイトル" });
    await userEvent.clear(input);
    await userEvent.type(input, "入力の途中");
    server.replyNext("admin/images/get", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: imageQueryKey(first.id),
      });
    });
    expect(queryClient.getQueryState(imageQueryKey(first.id))?.status).toBe(
      "error",
    );
    expect(
      within(dialog).getByRole<HTMLInputElement>("textbox", {
        name: "タイトル",
      }).value,
    ).toBe("入力の途中");
    expect(dialog.isConnected).toBe(true);
    act(() => {
      history.push("/images/" + second.id);
    });

    const confirm = await screen.findByRole("dialog", {
      name: "保存していない変更があります",
    });

    await userEvent.click(
      within(confirm).getByRole("button", { name: "変更を破棄" }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(server.images()[0]?.title).toBe(first.title);
  });
});
