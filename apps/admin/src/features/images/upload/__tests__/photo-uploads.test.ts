import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const dropPhotos = async (...names: readonly string[]): Promise<void> => {
  const data = new DataTransfer();

  for (const name of names) {
    data.items.add(
      new File(["x"], name, {
        type: name.endsWith(".bmp") ? "image/bmp" : "image/jpeg",
      }),
    );
  }

  const target =
    screen.queryByRole("dialog") ??
    (await screen.findByRole("heading", { name: "画像" }));

  fireEvent.dragEnter(target, { dataTransfer: data });
  fireEvent.dragOver(target, { dataTransfer: data });
  fireEvent.drop(target, { dataTransfer: data });
};

const uploadsRegion = () => screen.findByRole("dialog", { name: "写真を追加" });

/** 写真を送る procedure の応答を、テストから返させる作り物。 */
const holdUploads = (seeds: Parameters<typeof createImageRoutes>[0] = []) => {
  const server = createImageRoutes(seeds);
  const upload = server.routes["admin/images/upload"];
  const waiting: ((reply?: FakeReply<"admin/images/upload">) => void)[] = [];

  const routes: FakeRoutes = {
    ...server.routes,
    "admin/images/upload": async (input) => {
      const { promise, resolve } = Promise.withResolvers<
        FakeReply<"admin/images/upload"> | undefined
      >();

      waiting.push(resolve);

      return (await promise) ?? upload(input);
    },
  };

  return {
    server,
    routes,
    answer: async (reply?: FakeReply<"admin/images/upload">) => {
      await waitFor(() => {
        expect(waiting.length).toBeGreaterThan(0);
      });
      waiting.shift()?.(reply);
    },
  };
};

test("待機中の写真を選んでも、送信率は転送中の写真にだけ表示し、終わると取り除く", async () => {
  const held = holdUploads();
  const fractions = [0.64, 0.28, 0.13];
  renderApp({
    path: "/images",
    routes: held.routes,
    uploadProgress: (report) => {
      report(fractions.shift() ?? 0);
    },
  });
  await dropPhotos("first.jpg", "second.jpg", "third.jpg");
  const dialog = within(await uploadsRegion());
  await userEvent.click(dialog.getByRole("button", { name: "third.jpg" }));
  expect(dialog.getByText("アップロード待ち")).toBeDefined();

  const progress = async (name: string, percent: string) => {
    const ring = await dialog.findByRole("progressbar", {
      name: `「${name}」をアップロード中`,
    });

    await waitFor(() => {
      expect(ring.getAttribute("value")).toBe(percent);
    });
  };

  await progress("first.jpg", "64");
  await progress("second.jpg", "28");
  expect(dialog.getAllByRole("progressbar")).toHaveLength(2);
  expect(dialog.getByText("3枚中0枚完了")).toBeDefined();
  expect(dialog.queryByText("「first.jpg」をアップロード中")).toBeNull();
  await held.answer({ error: "UNSUPPORTED_FORMAT" });
  await progress("third.jpg", "13");
  await held.answer();
  await progress("third.jpg", "13");
  await held.answer();
  expect(await dialog.findByText("3枚中2枚完了・1枚失敗")).toBeDefined();
  expect(dialog.queryByRole("progressbar")).toBeNull();
});

test("画像一覧に落とした写真の形式と結果を確かめ、完了すると追加した写真が一覧に残る", async () => {
  const server = createImageRoutes([{ title: "前からある写真" }]);
  renderApp({ path: "/images", routes: server.routes });
  await dropPhotos("dusk.jpg", "scan.bmp");
  const uploads = await uploadsRegion();
  await within(uploads).findByText("アップロード済み");
  expect(
    within(uploads)
      .getByRole("link", { name: /写真を見る/v })
      .getAttribute("href"),
  ).toBe(`/images/${server.images()[0]?.id ?? ""}`);
  await userEvent.click(
    within(uploads).getByRole("button", { name: "scan.bmp" }),
  );
  expect(within(uploads).getByText("対応していない形式です")).toBeDefined();
  await userEvent.click(within(uploads).getByRole("button", { name: "完了" }));
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "写真を追加" }),
    );
  });
  expect(
    within(await screen.findByRole("list", { name: "画像" })).getAllByRole(
      "link",
    ),
  ).toHaveLength(2);
});

test("失敗した送信や完了した送信の通知は、送り直した写真や次に追加した写真の転送率に混ざらない", async () => {
  const held = holdUploads();
  const reports: ((fraction: number) => void)[] = [];
  renderApp({
    path: "/images",
    routes: held.routes,
    uploadProgress: (report) => {
      reports.push(report);
    },
  });
  await dropPhotos("dusk.jpg");
  await held.answer({ error: "INTERNAL_SERVER_ERROR", defined: false });
  await userEvent.click(
    await screen.findByRole("button", { name: "dusk.jpg を送り直す" }),
  );

  const retried = await screen.findByRole("progressbar", { name: /dusk.jpg/v });
  await waitFor(() => {
    expect(reports).toHaveLength(2);
  });
  act(() => {
    reports[1]?.(0.37);
    reports[0]?.(0.8);
  });
  expect(retried.getAttribute("value")).toBe("37");
  await held.answer();
  await screen.findByRole("link", { name: /写真を見る/v });
  await userEvent.click(screen.getByRole("button", { name: "完了" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  await dropPhotos("lake.jpg");

  const next = await screen.findByRole("progressbar", { name: /lake.jpg/v });
  await waitFor(() => {
    expect(reports).toHaveLength(3);
  });
  act(() => {
    reports[2]?.(0.29);
    reports[1]?.(1);
  });
  expect(next.getAttribute("value")).toBe("29");
  await held.answer();
  await screen.findByRole("link", { name: /写真を見る/v });
});

test("写真を追加で落としても入力中の写真と説明を保ち、完了するとタイトルと説明を保存する", async () => {
  const server = createImageRoutes([]);
  renderApp({ path: "/images", routes: server.routes });
  await dropPhotos("dusk.jpg", "lake.jpg");
  const dialog = await uploadsRegion();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "lake.jpg" }),
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: "説明" }),
    "湖の朝",
  );
  await dropPhotos("harbor.jpg");
  expect(
    within(dialog).getByRole("button", { name: "lake.jpg", pressed: true }),
  ).toBeDefined();
  expect(within(dialog).getByDisplayValue("湖の朝")).toBeDefined();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "dusk.jpg" }),
  );
  await userEvent.type(
    within(dialog).getByRole("textbox", { name: "タイトル" }),
    "夕暮れ",
  );
  await userEvent.click(within(dialog).getByRole("button", { name: "完了" }));
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  expect(
    server.images().map(({ title, description }) => [title, description]),
  ).toEqual([
    [null, null],
    [null, "湖の朝"],
    ["夕暮れ", null],
  ]);
});

test("送れなかった写真があると完了の前に確かめ、戻ると入力を保ち、破棄して完了を選ぶと片付ける", async () => {
  const held = holdUploads();
  renderApp({ path: "/images", routes: held.routes });
  await dropPhotos("dusk.jpg", "lost.jpg");
  const uploads = await uploadsRegion();
  await held.answer();
  await held.answer({ error: "INTERNAL_SERVER_ERROR", defined: false });
  await within(uploads).findByText("2枚中1枚完了・1枚失敗");
  await userEvent.click(
    within(uploads).getByRole("button", { name: "lost.jpg" }),
  );
  await userEvent.type(
    within(uploads).getByRole("textbox", { name: "タイトル" }),
    "夜",
  );
  await userEvent.click(within(uploads).getByRole("button", { name: "完了" }));

  const confirmation = await screen.findByRole("dialog", {
    name: "追加できなかった写真を破棄しますか？",
    description: /追加できなかった写真が1枚あります/v,
  });

  await userEvent.click(
    within(confirmation).getByRole("button", { name: "戻る" }),
  );
  await waitFor(() => {
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
  expect(
    within(await uploadsRegion()).getByRole("textbox", { name: "タイトル" }),
  ).toHaveProperty("value", "夜");
  await userEvent.click(
    within(await uploadsRegion()).getByRole("button", { name: "完了" }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "破棄して完了" }),
  );
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  expect(held.server.images()).toHaveLength(1);
  await userEvent.click(screen.getByRole("button", { name: "写真を追加" }));
  expect(
    within(await uploadsRegion()).queryByRole("button", { name: "lost.jpg" }),
  ).toBeNull();
});

test("受け取られた写真は変換中と出して完了を押せ、変換を終えるとアップロード済みに変わる", async () => {
  const server = createImageRoutes([], { status: "processing" });
  renderApp({ path: "/images", routes: server.routes });
  await dropPhotos("dusk.jpg");
  const uploads = within(await uploadsRegion());

  expect(await uploads.findByText("変換中")).toBeDefined();
  expect(uploads.getByText("閉じても変換は続きます")).toBeDefined();
  expect(uploads.getByText("1枚中0枚完了")).toBeDefined();
  expect(uploads.getByRole("button", { name: "完了" })).toHaveProperty(
    "disabled",
    false,
  );

  server.convert(server.images()[0]?.id ?? "", { status: "published" });

  expect(
    await uploads.findByText("アップロード済み", undefined, { timeout: 4000 }),
  ).toBeDefined();
  expect(uploads.getByText("1枚アップロード完了")).toBeDefined();
}, 10_000);

test("server の都合で変換を終えられなかった写真は送り直せ、変換できなかった画像を残さない", async () => {
  const server = createImageRoutes([], { status: "processing" });
  renderApp({ path: "/images", routes: server.routes });
  await dropPhotos("lake.jpg");
  const uploads = within(await uploadsRegion());

  await uploads.findByText("変換中");

  const [failed] = server.images();

  server.convert(failed?.id ?? "", { status: "interrupted" });
  expect(
    await uploads.findByText("変換できませんでした", undefined, {
      timeout: 4000,
    }),
  ).toBeDefined();

  await userEvent.click(
    uploads.getByRole("button", { name: "lake.jpg を送り直す" }),
  );
  expect(await uploads.findByText("変換中")).toBeDefined();
  await waitFor(() => {
    expect(server.images().map(({ id }) => id)).not.toContain(failed?.id);
  });
  expect(server.images()).toHaveLength(1);
}, 10_000);

test("写真を送っている間に Dialog を閉じて画面を離れようとすると確かめ、残ると同じ写真を再び開ける", async () => {
  const held = holdUploads();
  renderApp({ path: "/images", routes: held.routes });
  await dropPhotos("dusk.jpg");
  expect(await screen.findByText("アップロード中")).toBeDefined();
  const upload = await uploadsRegion();

  await userEvent.click(within(upload).getByRole("button", { name: "閉じる" }));
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "写真を追加" }),
    );
  });
  await userEvent.click(
    within(screen.getByRole("navigation")).getByRole("link", {
      name: "固定ページ",
    }),
  );

  const dialog = await screen.findByRole("dialog", {
    name: "写真の追加を終了しますか？",
  });

  await userEvent.click(
    within(dialog).getByRole("button", { name: "この画面に残る" }),
  );
  await held.answer();
  await userEvent.click(screen.getByRole("button", { name: "写真を追加" }));
  expect(
    await screen.findByRole("link", { name: /写真を見る/v }),
  ).toBeDefined();
});

test("セッションが切れたら、確かめずにログインの画面へ移り、残りの写真を送らない", async () => {
  const held = holdUploads();

  const { calls } = renderApp({ path: "/images", routes: held.routes });

  await dropPhotos("dusk.jpg", "lake.jpg", "forest.jpg");
  await held.answer({ error: "UNAUTHORIZED" });

  expect(
    await screen.findByRole("heading", { name: "Stilus にログイン" }),
  ).toBeDefined();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(calls.filter((path) => path === "admin/images/upload")).toHaveLength(
    2,
  );
});
