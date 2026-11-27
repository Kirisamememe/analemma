import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const open = (published = true) => {
  const server = createImageRoutes([
    { title: "港", published },
    { title: "朝の湖" },
  ]);

  const [first, second] = server.images();

  if (first === undefined || second === undefined) {
    throw new Error("画像が2枚必要です");
  }

  return {
    server,
    first,
    second,
    ...renderApp({ path: "/images/" + first.id, routes: server.routes }),
  };
};

const button = (name: string) => screen.getByRole("button", { name });
describe("表示中の画像への操作", () => {
  test.each(["編集", "非公開にする", "画像を削除"])(
    "%s の Dialog を開いたまま別の画像に移って戻っても、前の Dialog は開かない",
    async (name) => {
      const { history, first, second } = open();
      await userEvent.click(await screen.findByRole("button", { name }));
      expect(await screen.findByRole("dialog")).toBeDefined();
      act(() => {
        history.push("/images/" + second.id);
      });
      await screen.findByRole("heading", { name: "朝の湖" });
      expect(screen.queryByRole("dialog")).toBeNull();
      act(() => {
        history.push("/images/" + first.id);
      });
      await screen.findByRole("heading", { name: "港" });
      expect(screen.queryByRole("dialog")).toBeNull();
    },
  );

  test("前の公開の応答が届いても、戻った写真で開いた非公開の確認を残す", async () => {
    const { server, first, second, history } = open(false);
    const response = Promise.withResolvers<FakeReply<"admin/images/publish">>();
    server.replyNext("admin/images/publish", () => {
      server.routes["admin/images/publish"]({ id: first.id });
      return response.promise;
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "公開する" }),
    );
    act(() => {
      history.push("/images/" + second.id);
    });
    await screen.findByRole("heading", { name: "朝の湖" });
    act(() => {
      history.push("/images/" + first.id);
    });
    await screen.findByRole("heading", { name: "港" });
    await userEvent.click(
      await screen.findByRole("button", { name: "非公開にする" }),
    );
    await screen.findByRole("dialog");
    await act(async () => {
      response.resolve({ output: { ...first, status: "published" } });
      await response.promise;
    });
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "非公開にする",
      }),
    );
    await screen.findByRole("button", { name: "公開する" });
    expect(server.images()[0]?.status).toBe("unpublished");
  });

  test("削除の応答を待つ間に写真を往復しても、削除をもう一度送れない", async () => {
    const { server, first, second, history, calls } = open();
    const response = Promise.withResolvers<FakeReply<"admin/images/delete">>();
    server.replyNext("admin/images/delete", () => response.promise);
    await userEvent.click(
      await screen.findByRole("button", { name: "画像を削除" }),
    );
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "削除",
      }),
    );
    const load = Promise.withResolvers<FakeReply<"admin/images/get">>();
    server.replyNext("admin/images/get", () => load.promise);
    act(() => {
      history.push("/images/" + second.id);
    });
    await waitFor(() => {
      expect(history.location.pathname).toBe("/images/" + second.id);
    });
    act(() => {
      history.push("/images/" + first.id);
    });
    await screen.findByRole("heading", { name: "港" });
    await userEvent.click(screen.getByRole("button", { name: /画像を削除/v }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(calls.filter((call) => call === "admin/images/delete")).toHaveLength(
      1,
    );
    await act(async () => {
      load.resolve({ output: second });
      response.resolve({ output: undefined });
      await Promise.all([load.promise, response.promise]);
    });
  });

  test("編集前の情報を待つ間に別の画像へ移れば、戻った後にその応答が届いても Dialog は開かない", async () => {
    const { server, first, second, history } = open();
    await screen.findByRole("heading", { name: "港" });
    const response = Promise.withResolvers<FakeReply<"admin/images/get">>();
    server.replyNext("admin/images/get", () => response.promise);
    await userEvent.click(button("編集"));
    act(() => {
      history.push("/images/" + second.id);
    });
    await screen.findByRole("heading", { name: "朝の湖" });
    act(() => {
      history.push("/images/" + first.id);
    });
    await screen.findByRole("heading", { name: "港" });
    await act(async () => {
      response.resolve({ output: first });
      await response.promise;
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  test("写真を待つ間は変更を受け付けず、届いた後は同じ3つのボタンから新しい画像だけを変更する", async () => {
    const { server, first, second } = open();
    await screen.findByRole("heading", { name: "港" });

    const edit = button("編集"),
      publication = button("非公開にする"),
      remove = button("画像を削除");

    const response = Promise.withResolvers<FakeReply<"admin/images/get">>();
    server.replyNext("admin/images/get", () => response.promise);
    await userEvent.click(
      await screen.findByRole("link", { name: "次の画像" }),
    );

    for (const trigger of [edit, publication, remove]) {
      await userEvent.click(trigger);
    }

    expect(screen.queryByRole("dialog")).toBeNull();
    response.resolve({ output: second });
    await screen.findByRole("heading", { name: "朝の湖" });
    expect(button("編集")).toBe(edit);
    expect(button("非公開にする")).toBe(publication);
    expect(button("画像を削除")).toBe(remove);
    await userEvent.click(edit);
    const form = within(await screen.findByRole("dialog"));
    await userEvent.clear(form.getByRole("textbox", { name: "タイトル" }));
    await userEvent.type(form.getByRole("textbox", { name: "タイトル" }), "湖");
    await userEvent.click(form.getByRole("button", { name: "保存" }));
    await screen.findByRole("heading", { name: "湖" });
    await userEvent.click(publication);
    const confirm = await screen.findByRole("dialog");
    await userEvent.click(
      within(confirm).getByRole("button", { name: "非公開にする" }),
    );
    await screen.findByRole("button", { name: "公開する" });
    expect(server.images()[1]).toMatchObject({
      id: second.id,
      status: "unpublished",
      title: "湖",
    });
    await userEvent.click(remove);
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "削除",
      }),
    );
    await waitFor(() => {
      expect(server.images()).toEqual([first]);
    });
  });
});
