import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import type { PhotoUpload } from "../logic/photo-uploads";
import { UploadConversions } from "../upload-conversions";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const POLL_MS = 20;

test("取り直しの最初の応答が届いても、取り直しが失敗し続けても、親を描き直さない", async () => {
  const server = createImageRoutes([{ status: "processing" }]);
  const [image] = server.images();
  const first = Promise.withResolvers<undefined>();
  let replies: "waiting" | "failing" = "waiting";

  const app = createTestApp({
    path: "/",
    routes: {
      ...server.routes,
      "admin/images/get": (input) => {
        if (replies === "failing") {
          return { error: "INTERNAL_SERVER_ERROR", defined: false };
        }

        return first.promise.then(() =>
          server.routes["admin/images/get"](input),
        );
      },
    },
  });

  await app.router.load();
  app.queryClient.setDefaultOptions({ queries: { retry: false } });

  const uploads: readonly PhotoUpload[] = [
    {
      id: 1,
      file: new File(["photo"], "lake.jpg"),
      status: "converting",
      imageId: image?.id ?? "",
    },
  ];

  const settled = mock((): void => undefined);
  let renders = 0;

  const Parent = () => {
    renders += 1;

    return (
      <UploadConversions
        uploads={uploads}
        onSettled={settled}
        pollMs={POLL_MS}
      />
    );
  };

  render(<Parent />, { wrapper: withAppProviders(app) });

  const gets = () => app.calls.filter((path) => path === "admin/images/get");

  await waitFor(() => {
    expect(gets()).toHaveLength(1);
  });

  const rendered = renders;

  await act(async () => {
    first.resolve(undefined);
    await Bun.sleep(POLL_MS * 2);
  });
  replies = "failing";
  await waitFor(() => {
    expect(gets().length).toBeGreaterThan(4);
  });

  expect(renders).toBe(rendered);
  expect(settled).not.toHaveBeenCalled();
});
