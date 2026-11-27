import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";
import { Profiler } from "react";

import { ImageField } from "../image-field";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import { samplePhoto } from "@/testing/sample-photos";
import * as patterns from "@/ui/patterns";
import * as overlays from "@/ui/primitives/overlays";

afterEach(cleanup);

const deliveryImages = samplePhoto("dusk-ridge");

test("変換中の画像を選んだまま画像を選ぶ Dialog を開いていても、取り直している間は Dialog もタイルも描き直さず、変換を終えたらその画像のタイルだけを描き直す", async () => {
  const server = createImageRoutes([
    { title: "新しい写真", status: "processing" },
    { title: "海", deliveryImages },
    { title: "山", deliveryImages },
  ]);

  const [converting] = server.images();
  const app = createTestApp({ path: "/", routes: server.routes });

  await app.router.load();
  const commits: string[] = [];
  const Tile = patterns.ImageTile;
  using tiles = spyOn(patterns, "ImageTile").mockImplementation((props) => (
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

  render(
    <ImageField
      label="表紙"
      required={false}
      target="表紙"
      value={converting?.id ?? ""}
      onChange={() => undefined}
    />,
    { wrapper: withAppProviders(app) },
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "差し替える（表紙）" }),
  );
  await screen.findByRole("radio", { name: /新しい写真/v, checked: true });
  await screen.findByRole("radio", { name: /山/v });
  expect(tiles).toHaveBeenCalled();

  const polls = (): number =>
    app.calls.filter((call) => call === "admin/images/get").length;

  const polled = polls();

  commits.length = 0;
  dialog.mockClear();
  await waitFor(
    () => {
      expect(polls()).toBeGreaterThan(polled + 1);
    },
    { timeout: 8000 },
  );
  expect(commits).toEqual([]);
  expect(dialog).not.toHaveBeenCalled();

  server.convert(converting?.id ?? "", { status: "published", deliveryImages });
  await waitFor(
    () => {
      expect(screen.queryByText("変換中")).toBeNull();
    },
    { timeout: 4000 },
  );
  expect(new Set(commits)).toEqual(new Set(["新しい写真"]));
  expect(
    screen.getByRole("radio", { name: /新しい写真/v, checked: true }),
  ).toBeDefined();
}, 20_000);
