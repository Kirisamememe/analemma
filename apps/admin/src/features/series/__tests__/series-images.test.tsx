import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";
import { Children, type ComponentProps, isValidElement, Profiler } from "react";

import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";
import * as layout from "@/ui/layout";
import { ImageThumbnail } from "@/ui/patterns";

afterEach(cleanup);

test("ほかの画像を並べ直しても、残った写真と名前は描き直さない", async () => {
  const title = "港の灯り";
  const commits: string[] = [];

  const record = (id: string): void => {
    commits.push(id);
  };

  const { Cluster } = layout;
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

  const commitsFor = (photo: string) =>
    commits.filter((src) => src.includes(photo)).length;

  renderApp({
    path: `/series/${SAMPLE_SERIES_ID}`,
    routes: createSeriesRoutes(),
  });

  const user = userEvent.setup();
  await screen.findByRole("row", { name: title });
  const baseline = commitsFor("night-harbor");
  expect(baseline).toBeGreaterThan(0);

  await user.click(screen.getByRole("row", { name: "夕暮れの稜線" }));
  await user.keyboard("{Tab}{Enter}{ArrowDown}{Enter}");
  await screen.findByText("並び順を保存しました。");
  expect(commitsFor("morning-lake")).toBeGreaterThan(1);
  expect(commitsFor("night-harbor")).toBe(baseline);
});
