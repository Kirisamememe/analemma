import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import { Profiler } from "react";

import { ImagesSection } from "@/components/images/images-section";
import { PhotoUploads } from "@/features/images/upload/photo-uploads";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const holdUploads = () => {
  const server = createImageRoutes([{ title: "前からある写真" }]);
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

const dropPhotos = async (...names: readonly string[]): Promise<void> => {
  const data = new DataTransfer();

  for (const name of names) {
    data.items.add(
      new File(["x"], name, {
        type: name.endsWith(".bmp") ? "image/bmp" : "image/jpeg",
      }),
    );
  }

  const target = await screen.findByRole("button", { name: "写真を追加" });

  fireEvent.dragEnter(target, { dataTransfer: data });
  fireEvent.dragOver(target, { dataTransfer: data });
  fireEvent.drop(target, { dataTransfer: data });
};

test("選択していない写真が送信に失敗しても入力欄を保ち、画像の一覧を描き直さない", async () => {
  const held = holdUploads();
  const app = createTestApp({ path: "/images", routes: held.routes });

  await app.router.load();

  const listCommits: string[] = [];

  render(
    <main>
      <PhotoUploads imageHref={(id) => `/images/${id}`} />
      <Profiler
        id="images"
        onRender={(id) => {
          listCommits.push(id);
        }}
      >
        <ImagesSection imageHref={(id) => `/images/${id}`} />
      </Profiler>
    </main>,
    { wrapper: withAppProviders(app) },
  );

  const list = await screen.findByRole("list", { name: "画像" });

  await dropPhotos("a.jpg", "b.jpg", "c.jpg");
  await held.answer();
  await screen.findByRole("link", { name: /写真を見る/v });
  await held.answer();

  await waitFor(() => {
    expect(within(list).getAllByRole("link", { hidden: true })).toHaveLength(3);
  });

  const committed = listCommits.length;

  const title = screen.getByRole("textbox", { name: "タイトル" });
  act(() => {
    title.focus();
  });
  await held.answer({ error: "UNSUPPORTED_FORMAT" });
  await screen.findByText("3枚中2枚完了・1枚失敗");
  expect(document.activeElement).toBe(title);
  expect(listCommits).toHaveLength(committed);
});
