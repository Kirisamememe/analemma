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
  expect(screen.getByRole("status").textContent).toBe("海");
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

test("現在の表紙を選んだ状態で開き、選び直しても取り消せば確定しない", async () => {
  const close = mock((): void => undefined);
  const confirm = mock((_value: unknown): void => undefined);
  render(
    <ImagePicker
      initialImage={server.images()[1]}
      mode="single"
      onClose={close}
      onConfirm={confirm}
    />,
    await setup(),
  );

  const current = await screen.findByRole("radio", {
    name: /海/v,
    checked: true,
  });

  current.focus();
  await userEvent.keyboard("{ArrowRight}");
  const next = screen.getByRole("radio", { name: /山/v, checked: true });
  expect(document.activeElement).toBe(next);
  await userEvent.keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
});

test.each([
  { selectedFirst: false, expectedTitle: "海" },
  { selectedFirst: true, expectedTitle: "山" },
])(
  "現在の表紙を読み込む間に選び直したかに応じて「$expectedTitle」を確定する",
  async ({ selectedFirst, expectedTitle }) => {
    const confirm = mock((_value: unknown): void => undefined);
    const close = mock((): void => undefined);

    const { rerender } = render(
      <ImagePicker mode="single" onClose={close} onConfirm={confirm} />,
      await setup(),
    );

    const replacement = await screen.findByRole("radio", { name: /山/v });

    if (selectedFirst) await userEvent.click(replacement);

    rerender(
      <ImagePicker
        initialImage={server.images()[1]}
        mode="single"
        onClose={close}
        onConfirm={confirm}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe(expectedTitle);
    expect(screen.getByRole("radio", { checked: true })).toBe(
      screen.getByRole("radio", { name: selectedFirst ? /山/v : /海/v }),
    );
    await userEvent.click(screen.getByRole("button", { name: "選択を確定" }));
    expect(confirm).toHaveBeenCalledWith(
      server.images().find(({ title }) => title === expectedTitle),
    );
  },
);
