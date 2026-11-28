import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";
import { Profiler } from "react";

import { ImagePicker } from "../../image-picker";

import * as imageTile from "@/components/images/ui/image-tile";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import * as overlays from "@/ui/primitives/overlays";

afterEach(cleanup);

test("1枚を選択・解除すると、その写真の選択状態と枚数が更新され、ほかのタイルと Dialog は再描画されない", async () => {
  const { routes } = createImageRoutes([
    { title: "海" },
    { title: "山" },
    { title: "湖" },
  ]);

  const app = createTestApp({ path: "/", routes });
  await app.router.load();
  const commits: string[] = [];
  const Tile = imageTile.ImageTile;
  using tiles = spyOn(imageTile, "ImageTile").mockImplementation((props) => (
    <Profiler
      id={props.title ?? ""}
      onRender={(id) => {
        commits.push(id);
      }}
    >
      <Tile
        alt={props.alt ?? null}
        badge={props.badge}
        choice={props.choice}
        date={props.date}
        href={props.href}
        images={props.images}
        linkRef={props.linkRef}
        missing={props.missing}
        title={props.title}
        untitled={props.untitled}
      />
    </Profiler>
  ));
  using dialog = spyOn(overlays, "Modal");

  const { rerender } = render(
    <ImagePicker
      mode="multiple"
      onConfirm={() => undefined}
      onClose={() => undefined}
    />,
    { wrapper: withAppProviders(app) },
  );

  const lake = await screen.findByRole("checkbox", { name: /湖/v });
  expect(tiles).toHaveBeenCalled();
  expect(dialog).toHaveBeenCalled();
  expect(commits.toSorted()).toEqual(["山", "海", "湖"].toSorted());

  for (const count of [1, 0]) {
    commits.length = 0;
    dialog.mockClear();
    await userEvent.click(lake);
    expect(lake.matches(":checked")).toBe(count === 1);
    expect(screen.getByText(`選択中の画像 ${String(count)} 枚`)).toBeDefined();
    expect(commits).toEqual(["湖"]);
    expect(dialog).not.toHaveBeenCalled();
  }

  tiles.mockClear();
  rerender(
    <ImagePicker
      mode="multiple"
      isPending
      onConfirm={() => undefined}
      onClose={() => undefined}
    />,
  );
  expect(lake.matches(":disabled")).toBe(true);
  expect(tiles).not.toHaveBeenCalled();
});
