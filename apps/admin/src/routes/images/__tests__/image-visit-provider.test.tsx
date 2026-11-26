import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import {
  Profiler,
  type ProfilerOnRenderCallback,
  type ReactNode,
  use,
} from "react";

import {
  ImageVisitContext,
  ViewerTargetContext,
} from "../image-viewer-context";
import { ImageVisitProvider } from "../image-visit-provider";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withAppProviders } from "@/testing/hook-wrappers";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

afterEach(cleanup);

type ProbeProps = {
  /** 描いたことを数える関数。 */
  onRender: ProfilerOnRenderCallback;
};

const ActionsProbe = ({ onRender }: ProbeProps): ReactNode => {
  const target = use(ViewerTargetContext);

  return (
    <Profiler id="actions" onRender={onRender}>
      <p>
        {target?.image.title ?? "無題"}
        {target?.isDisabled === true && "(待っています)"}
      </p>
    </Profiler>
  );
};

const PhotoProbe = ({ onRender }: ProbeProps): ReactNode => {
  const visit = use(ImageVisitContext);
  const pending = visit?.pending;

  return (
    <Profiler id="photo" onRender={onRender}>
      {pending !== undefined && (
        <button
          type="button"
          onClick={() => {
            visit?.settle(pending.id);
          }}
        >
          写真を読み込み終えた
        </button>
      )}
    </Profiler>
  );
};

test("写真を送る間、帯の操作は、表示中の画像か受け付けるかが変わったときだけ描き直す", async () => {
  const server = createImageRoutes(SAMPLE_IMAGES);
  const [first, second] = server.images();

  if (first === undefined || second === undefined) {
    throw new Error("画像が2枚必要です");
  }

  const app = createTestApp({ path: "/", routes: server.routes });
  await app.router.load();
  const Providers = withAppProviders(app);
  const renders: string[] = [];

  const onRender: ProfilerOnRenderCallback = (id) => {
    renders.push(id);
  };

  const count = (id: string) => renders.filter((each) => each === id).length;

  const probes = (
    <>
      <ActionsProbe onRender={onRender} />
      <PhotoProbe onRender={onRender} />
    </>
  );

  const { rerender } = render(
    <Providers>
      <ImageVisitProvider id={first.id}>{probes}</ImageVisitProvider>
    </Providers>,
  );

  await screen.findByText("夕暮れの稜線");
  renders.length = 0;
  rerender(
    <Providers>
      <ImageVisitProvider id={second.id}>{probes}</ImageVisitProvider>
    </Providers>,
  );
  await screen.findByText("夕暮れの稜線(待っています)");
  await act(async () => {
    (
      await screen.findByRole("button", { name: "写真を読み込み終えた" })
    ).click();
  });
  await screen.findByText("無題");

  expect(count("actions")).toBe(2); // 待ち始めたときと、次の写真に替わったとき
  expect(count("photo")).toBeGreaterThan(count("actions"));
});
