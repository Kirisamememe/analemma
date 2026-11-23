import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const setup = () => {
  const server = createImageRoutes([{ title: "港" }, { title: "雪山" }]);
  const [image, next] = server.images();

  if (image === undefined || next === undefined) {
    throw new Error("写真が足りません");
  }

  const app = renderApp({
    path: "/images/" + image.id.toUpperCase(),
    routes: server.routes,
  });

  return { server, image, next, ...app };
};

const openEditor = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "編集" }));
  return within(
    await screen.findByRole("dialog", { name: "タイトルと説明を編集" }),
  );
};

const confirmDiscard = async () =>
  within(
    await screen.findByRole("dialog", { name: "保存していない変更があります" }),
  );

describe("EditImage", () => {
  test("別のタブで更新した説明を保持し、URL の ID が大文字でも編集したタイトルを表示する", async () => {
    const { server, image } = setup();

    await screen.findByRole("heading", { name: "港" });
    server.routes["admin/images/update"]({
      id: image.id,
      title: "港",
      description: "別のタブで保存",
      alt: null,
    });
    const editor = await openEditor();

    expect(
      editor.getByRole<HTMLTextAreaElement>("textbox", { name: "説明" }).value,
    ).toBe("別のタブで保存");
    await userEvent.type(
      editor.getByRole("textbox", { name: "タイトル" }),
      "の灯り",
    );
    await userEvent.click(editor.getByRole("button", { name: "保存" }));
    await screen.findByRole("heading", { name: "港の灯り" });
    expect(server.images()[0]?.description).toBe("別のタブで保存");
  });

  test("未保存の変更を閉じる前に確かめ、編集を続けると入力を保つ", async () => {
    setup();
    const editor = await openEditor();
    await userEvent.type(editor.getByRole("textbox", { name: "alt" }), "夜景");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      (await confirmDiscard()).getByRole("button", { name: "編集を続ける" }),
    );
    expect(
      editor.getByRole<HTMLInputElement>("textbox", { name: "alt" }).value,
    ).toBe("夜景");
    await userEvent.click(editor.getByRole("button", { name: "キャンセル" }));
    await userEvent.click(
      (await confirmDiscard()).getByRole("button", { name: "変更を破棄" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("別の写真に移る前に確かめ、破棄した入力を移動先の写真に送らない", async () => {
    const { image, history, server } = setup();
    await userEvent.click(
      await screen.findByRole("link", { name: "次の画像" }),
    );
    await screen.findByRole("heading", { name: "雪山" });
    const editor = await openEditor();

    await userEvent.type(editor.getByRole("textbox", { name: "説明" }), "新雪");
    act(() => {
      history.push("/images/" + image.id);
    });
    await userEvent.click(
      (await confirmDiscard()).getByRole("button", { name: "変更を破棄" }),
    );
    await screen.findByRole("heading", { name: "港" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(server.images()[0]?.description).toBeNull();
    expect(server.images()[1]?.description).toBeNull();
  });

  test("保存の応答を待つ間は入力を保護し、失敗したあとに同じ入力で保存し直せる", async () => {
    const { server } = setup();
    const deferred = Promise.withResolvers<FakeReply<"admin/images/update">>();
    server.replyNext("admin/images/update", () => deferred.promise);
    const editor = await openEditor();
    const alt = editor.getByRole<HTMLInputElement>("textbox", { name: "alt" });
    await userEvent.type(alt, "夜景");
    await userEvent.click(editor.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(alt.readOnly).toBe(true);
    });
    await userEvent.type(alt, "余分");
    expect(alt.value).toBe("夜景");
    deferred.resolve({ error: "INTERNAL_SERVER_ERROR", defined: false });
    await screen.findByText(/画像を保存できませんでした/v);
    expect(alt.value).toBe("夜景");
    await userEvent.click(editor.getByRole("button", { name: "保存" }));
    await screen.findByText("画像を更新しました。");
    expect(server.images()[0]?.alt).toBe("夜景");
  });
});
