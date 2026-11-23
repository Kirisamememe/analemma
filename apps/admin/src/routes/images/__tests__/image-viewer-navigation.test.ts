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

  if (first === undefined || second === undefined)
    {throw new Error("画像が2枚必要です");}
  const app = renderApp({ path: "/images/" + first.id, routes: server.routes });

  return { server, first, second, ...app };
};

describe("写真を送るときの表示", () => {
  test("次の写真を読み込むまで元の写真と情報を保ち、読み終えた img をそのまま表示する", async () => {
    const { first, second } = open();
    const panel = await screen.findByRole("complementary");
    const old = screen.getByRole("img", { name: first.alt ?? "" });
    fireEvent.load(old);
    const title = within(panel).getByRole("heading", { level: 1 });
    await userEvent.click(
      await screen.findByRole("link", { name: "次の画像" }),
    );

    const next = await screen.findByAltText(
      second.alt ?? second.title ?? "無題の画像",
    );

    expect(old.isConnected).toBe(true);
    expect(title.isConnected).toBe(true);
    expect(
      screen.getByRole("button", { name: "編集" }).hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.load(next);
    expect(screen.getByRole("img", { name: "無題の画像" })).toBe(next);
    expect(screen.getByRole("complementary")).toBe(panel);
    expect(within(panel).getByRole("heading", { level: 1 }).textContent).toBe(
      "無題の画像",
    );
    expect(
      screen.getByRole("button", { name: "編集" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  test("編集している画像を取り直せなくても入力が残り、別の画像に移れば古い Dialog を閉じる", async () => {
    const { server, first, second, queryClient, history } = open();
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
    expect(within(dialog).getByDisplayValue("入力の途中")).toBe(input);
    expect(dialog.isConnected).toBe(true);
    act(() => {
      history.push("/images/" + second.id);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(server.images()[0]?.title).toBe(first.title);
  });
});
