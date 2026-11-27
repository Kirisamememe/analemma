import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, mock, test } from "bun:test";

import { ImagePicker } from "../../image-picker";

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
