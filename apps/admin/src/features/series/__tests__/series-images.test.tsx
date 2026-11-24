import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";
import {
  Children,
  cloneElement,
  type ComponentProps,
  createElement,
  isValidElement,
  Profiler,
  type ReactElement,
} from "react";

import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";
import * as layout from "@/ui/layout";
import { ImageThumbnail } from "@/ui/patterns";
import * as buttons from "@/ui/primitives/button";

afterEach(cleanup);

type RenderButton = (props: ComponentProps<"button">) => ReactElement;

test("ほかの画像を追加・並べ直し・取り外ししても、残った写真と名前は描き直さない", async () => {
  const title = "港の灯り";
  const commits: string[] = [];

  const record = (id: string): void => {
    commits.push(id);
  };

  const { Cluster } = layout;
  const { Button } = buttons;
  using photoRows = spyOn(layout, "Cluster").mockImplementation((props) => {
    const content = Cluster(props);

    for (const child of Children.toArray(props.children)) {
      if (
        isValidElement<ComponentProps<typeof ImageThumbnail>>(child) &&
        child.type === ImageThumbnail &&
        child.props.src !== undefined
      ) {
        return (
          <Profiler id={child.props.src} onRender={record}>
            {content}
          </Profiler>
        );
      }
    }

    return content;
  });
  using buttonsRendered = spyOn(buttons, "Button").mockImplementation(
    (props) => {
      const element = Button(props);

      if (
        props["aria-label"] !== "「港の灯り」をシリーズから外す" ||
        !isValidElement<Record<"render", RenderButton>>(element)
      ) {
        return element;
      }

      return cloneElement(element, {
        render: (domProps) => (
          <Profiler id="remove" onRender={record}>
            {createElement("button", { ...domProps, type: "button" })}
          </Profiler>
        ),
      });
    },
  );

  const commitsFor = (photo: string) =>
    commits.filter((src) => src.includes(photo)).length;

  const routes = createSeriesRoutes();
  const reply = Promise.withResolvers<undefined>();

  const { calls } = renderApp({
    path: `/series/${SAMPLE_SERIES_ID}`,
    routes: {
      ...routes,
      "admin/series/removeImages": async (input) => {
        await reply.promise;
        return routes["admin/series/removeImages"](input);
      },
    },
  });

  const user = userEvent.setup();
  await screen.findByRole("row", { name: title });
  const baseline = commitsFor("night-harbor");
  const buttonsBefore = commitsFor("remove");
  expect(buttonsBefore).toBeGreaterThan(0);
  expect(baseline).toBeGreaterThan(0);

  await user.click(screen.getByRole("row", { name: "夕暮れの稜線" }));
  await user.keyboard("{Tab}{Enter}{ArrowDown}{Enter}");
  await screen.findByText("並び順を保存しました。");
  expect(commitsFor("morning-lake")).toBeGreaterThan(1);
  expect(commitsFor("night-harbor")).toBe(baseline);
  expect(commitsFor("remove")).toBe(buttonsBefore);

  await user.click(screen.getByRole("row", { name: "夕暮れの稜線" }));
  await user.keyboard("{Tab}{Tab}");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "「夕暮れの稜線」をシリーズから外す" }),
  );
  await user.keyboard("{Enter}");
  await screen.findByRole("progressbar");
  await user.click(
    screen.getByRole("button", { name: /無題.*シリーズから外す/v }),
  );
  expect(
    calls.filter((call) => call === "admin/series/removeImages"),
  ).toHaveLength(1);
  reply.resolve(undefined);
  await screen.findByText("シリーズから画像を外しました。");
  expect(
    calls.filter((call) => call === "admin/series/removeImages"),
  ).toHaveLength(1);
  expect(screen.getByRole("row", { name: /無題/v })).toBeDefined();
  expect(commitsFor("night-harbor")).toBe(baseline);
  expect(commitsFor("remove")).toBe(buttonsBefore);

  await user.click(screen.getByRole("button", { name: "画像を追加" }));
  await user.click(
    await screen.findByRole("checkbox", { name: /夕暮れの稜線/v }),
  );
  await user.click(screen.getByRole("button", { name: "選択を確定" }));
  await screen.findByText("シリーズに画像を追加しました。");
  expect(commitsFor("night-harbor")).toBe(baseline);
  expect(commitsFor("remove")).toBe(buttonsBefore);
});
