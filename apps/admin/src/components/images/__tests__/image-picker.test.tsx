import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { ImagePicker } from "../image-picker";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const server = createImageRoutes([
  { title: "湖" },
  { title: "海", published: false },
  { title: "山" },
]);

const setup = async (library = server) => {
  const app = createTestApp({ path: "/", routes: library.routes });
  await app.router.load();

  return { wrapper: withAppProviders(app) };
};

test("1枚を選ぶ場合は選び直した画像だけを確定する", async () => {
  const confirm = mock((_value: unknown): void => undefined);
  render(
    <ImagePicker mode="single" onClose={() => undefined} onConfirm={confirm} />,
    await setup(),
  );
  await userEvent.click(await screen.findByRole("radio", { name: /湖/v }));
  await userEvent.click(screen.getByRole("radio", { name: /海.*非公開/v }));
  expect(screen.getByText("選択中の画像 1 枚")).toBeDefined();
  await userEvent.click(screen.getByRole("button", { name: "選択を確定" }));
  expect(confirm).toHaveBeenCalledWith(server.images()[1]);
});

test("追加済みの写真を除き、キーボードで複数枚を選んで確定できる", async () => {
  const confirm = mock((_value: unknown): void => undefined);
  render(
    <ImagePicker
      mode="multiple"
      included={
        new Set(
          server
            .images()
            .slice(0, 1)
            .map(({ id }) => id),
        )
      }
      onClose={() => undefined}
      onConfirm={confirm}
    />,
    await setup(),
  );
  expect(
    (await screen.findByRole("checkbox", { name: /湖.*追加済み/v })).matches(
      ":disabled",
    ),
  ).toBe(true);
  screen.getByRole("checkbox", { name: /山/v }).focus();
  await userEvent.keyboard(" {Shift>}{Tab}{/Shift} {Tab}{Tab}{Tab}{Enter}");
  expect(confirm).toHaveBeenCalledWith(server.images().slice(1).toReversed());
});

test("続きを読んでも先に選んだ写真を保ち、新しいページの最初の写真へ focus が移る", async () => {
  const library = createImageRoutes(
    Array.from({ length: 51 }, (_, index) => ({
      title: `写真 ${String(index + 1)}`,
    })),
  );

  const confirm = mock((_value: unknown): void => undefined);
  render(
    <ImagePicker
      mode="multiple"
      onClose={() => undefined}
      onConfirm={confirm}
    />,
    await setup(library),
  );
  await userEvent.click(
    await screen.findByRole("checkbox", { name: /写真 1$/v }),
  );
  await userEvent.click(screen.getByRole("button", { name: "さらに読み込む" }));
  const last = await screen.findByRole("checkbox", { name: /写真 51$/v });
  expect(last.matches(":focus")).toBe(true);
  await userEvent.keyboard(" ");
  await userEvent.click(screen.getByRole("button", { name: "選択を確定" }));
  expect(confirm).toHaveBeenCalledWith([
    library.images()[0],
    library.images()[50],
  ]);
});

test("最後のページがすべて追加済みなら、直前の選べる写真に focus が戻る", async () => {
  const library = createImageRoutes(
    Array.from({ length: 51 }, (_, i) => ({ title: `写真 ${String(i + 1)}` })),
  );

  const included = new Set(
    library
      .images()
      .slice(50)
      .map(({ id }) => id),
  );

  render(
    <ImagePicker
      mode="multiple"
      included={included}
      onClose={() => undefined}
      onConfirm={() => undefined}
    />,
    await setup(library),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "さらに読み込む" }),
  );
  await screen.findByRole("checkbox", { name: /写真 51.*追加済み/v });
  expect(
    screen.getByRole("checkbox", { name: /写真 50$/v }).matches(":focus"),
  ).toBe(true);
});
