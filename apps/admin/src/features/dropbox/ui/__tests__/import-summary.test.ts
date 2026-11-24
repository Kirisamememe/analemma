import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  type FakeDropboxSeed,
} from "@/testing/fake-routes/create-dropbox-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const AT = "2026-03-01T09:00:00.000Z";

const open = (seed: FakeDropboxSeed) =>
  renderApp({
    path: "/images/dropbox",
    routes: {
      ...createImageRoutes().routes,
      ...createDropboxRoutes({ connection: FAKE_DROPBOX_CONNECTED, ...seed })
        .routes,
    },
  });

describe("ImportSummary", () => {
  test("取り込めなかった写真があれば、足した数と一緒に伝えること", async () => {
    open({
      photos: [],
      run: {
        startedAt: AT,
        finishedAt: AT,
        photos: [
          { id: "id:a", path: "/a.jpg", status: "added", imageId: null },
          { id: "id:b", path: "/b.jpg", status: "too-large", imageId: null },
        ],
      },
    });

    expect(
      await screen.findByText(
        "2枚のうち1枚を足しました。1枚は取り込めませんでした。",
      ),
    ).toBeDefined();
  });
});
