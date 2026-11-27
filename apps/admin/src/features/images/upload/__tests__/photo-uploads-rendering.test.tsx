import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, spyOn, test } from "bun:test";
import { Profiler } from "react";

import * as carousel from "../upload-carousel";

import { ImagesSection } from "@/components/images/images-section";
import * as controls from "@/features/images/upload/hooks/use-upload-dialog";
import { PhotoUploads } from "@/features/images/upload/photo-uploads";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import * as formFields from "@/ui/primitives/form-fields";

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

test("原稿に1文字入力してもDialog全体を描き直さず、次に選んだ写真とは別々の値を保つ", async () => {
  const held = holdUploads();
  const app = createTestApp({ path: "/images", routes: held.routes });
  await app.router.load();

  using dialog = spyOn(controls, "useUploadDialog");
  using rail = spyOn(carousel, "UploadCarousel");
  using description = spyOn(formFields, "TextArea");
  render(
    <main>
      <PhotoUploads imageHref={(id) => `/images/${id}`} />
    </main>,
    {
      wrapper: withAppProviders(app),
    },
  );
  await dropPhotos("a.jpg", "b.jpg");
  await waitFor(() => {
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });
  const field = screen.getByRole("textbox", { name: "タイトル" });
  expect(description).toHaveBeenCalled();
  expect(rail).toHaveBeenCalled();
  dialog.mockClear();
  rail.mockClear();
  description.mockClear();
  fireEvent.change(field, { target: { value: "山" } });
  expect(screen.getByDisplayValue("山")).toBe(field);
  expect(dialog).not.toHaveBeenCalled();
  expect(rail).not.toHaveBeenCalled();
  expect(description).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "b.jpg" }));
  expect(screen.queryByDisplayValue("山")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "a.jpg" }));
  expect(screen.getByDisplayValue("山")).toBe(field);
});

test("転送率の通知が届いても、Dialog とカルーセルを再レンダリングしない", async () => {
  const held = holdUploads();
  const reports: ((fraction: number) => void)[] = [];

  const app = createTestApp({
    path: "/images",
    routes: held.routes,
    uploadProgress: (report) => {
      reports.push(report);
    },
  });

  await app.router.load();

  using dialog = spyOn(controls, "useUploadDialog");
  using rail = spyOn(carousel, "UploadCarousel");
  render(
    <main>
      <PhotoUploads imageHref={(id) => `/images/${id}`} />
    </main>,
    { wrapper: withAppProviders(app) },
  );
  await dropPhotos("a.jpg", "b.jpg");
  await waitFor(() => {
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(reports).toHaveLength(2);
  });

  const ring = screen.getByRole("progressbar", {
    name: "「a.jpg」をアップロード中",
  });

  expect(dialog).toHaveBeenCalled();
  expect(rail).toHaveBeenCalled();
  dialog.mockClear();
  rail.mockClear();
  act(() => {
    reports[0]?.(0.5);
  });
  expect(ring.getAttribute("value")).toBe("50");
  expect(dialog).not.toHaveBeenCalled();
  expect(rail).not.toHaveBeenCalled();
});
