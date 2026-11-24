import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";
import { Profiler, type ReactNode } from "react";

import { useDropboxPhotoRow } from "@/features/dropbox/hooks/use-dropbox-photo-row";
import {
  DROPBOX_IMPORT_KEY,
  DROPBOX_PHOTOS_KEY,
  type DropboxImport,
  type DropboxPhoto,
  type DropboxPhotos,
} from "@/features/dropbox/queries/dropbox-queries";
import { createTestApp } from "@/testing/create-test-app";
import { createDropboxRoutes } from "@/testing/fake-routes/create-dropbox-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const AT = "2026-03-01T09:00:00.000Z";
const IMAGE_ID = "019b0000-0000-7000-8000-000000000001";

const photo = (id: string): DropboxPhoto => ({
  id,
  path: `/${id.slice(3)}.jpg`,
  size: 1000,
  modifiedAt: AT,
  imported: null,
  contentHash: "a".repeat(64),
});

/** 見本の写真の ID を渡す値。 */
type ProbeProps = {
  /** 写真の ID。 */
  readonly id: string;
};

const Probe = ({ id }: ProbeProps): ReactNode => {
  const row = useDropboxPhotoRow(id);

  return <span>{`${id}:${row?.status ?? "none"}`}</span>;
};

const setUp = async () => {
  const app = createTestApp({
    path: "/enroll",
    routes: createDropboxRoutes().routes,
  });

  await app.router.load();

  return { client: app.queryClient, Wrapper: withAppProviders(app) };
};

const runOf = (
  statuses: Readonly<Record<string, DropboxImport["photos"][number]["status"]>>,
): DropboxImport => ({
  startedAt: AT,
  finishedAt: null,
  photos: Object.entries(statuses).map(([id, status]) => ({
    id,
    path: `/${id.slice(3)}.jpg`,
    status,
    imageId: status === "added" ? IMAGE_ID : null,
  })),
});

test("取り込みの進み具合が変わっても、状態の変わった写真の行だけを描き直すこと", async () => {
  const { client, Wrapper } = await setUp();
  const renders = new Map<string, number>();

  const listed: DropboxPhotos = {
    _tag: "Listed",
    photos: [photo("id:a"), photo("id:b"), photo("id:c")],
  };

  client.setQueryData(DROPBOX_PHOTOS_KEY, listed);
  client.setQueryData(
    DROPBOX_IMPORT_KEY,
    runOf({ "id:a": "importing", "id:b": "waiting", "id:c": "waiting" }),
  );

  render(
    <Wrapper>
      {["id:a", "id:b", "id:c"].map((id) => (
        <Profiler
          id={id}
          key={id}
          onRender={(profiled) => {
            renders.set(profiled, (renders.get(profiled) ?? 0) + 1);
          }}
        >
          <Probe id={id} />
        </Profiler>
      ))}
    </Wrapper>,
  );

  await act(async () => {
    client.setQueryData(
      DROPBOX_IMPORT_KEY,
      runOf({ "id:a": "added", "id:b": "importing", "id:c": "waiting" }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  });

  expect(screen.getByText("id:a:added")).toBeDefined();
  expect(screen.getByText("id:b:importing")).toBeDefined();
  expect(Object.fromEntries(renders)).toEqual({
    "id:a": 2,
    "id:b": 2,
    "id:c": 1,
  });
});

test("App folder の一覧に無い写真は、行を返さないこと", async () => {
  const { client, Wrapper } = await setUp();

  const listed: DropboxPhotos = { _tag: "Listed", photos: [photo("id:a")] };

  client.setQueryData(DROPBOX_PHOTOS_KEY, listed);

  render(
    <Wrapper>
      <Probe id="id:gone" />
    </Wrapper>,
  );

  expect(screen.getByText("id:gone:none")).toBeDefined();
});
