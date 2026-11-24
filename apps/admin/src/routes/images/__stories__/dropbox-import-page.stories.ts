import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeRoutes } from "@/testing/create-fake-api";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  FAKE_DROPBOX_RETURN,
  type FakeDropboxPhoto,
  type FakeDropboxSeed,
} from "@/testing/fake-routes/create-dropbox-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

const AT = "2026-11-23T12:04:00.000Z";
const IMAGE_ID = "019b0000-0000-7000-8000-000000000001";

const photo = (
  id: string,
  change: Partial<FakeDropboxPhoto> & Pick<FakeDropboxPhoto, "path" | "size">,
): FakeDropboxPhoto => ({
  id: `id:${id}`,
  modifiedAt: AT,
  imported: null,
  contentHash: id.repeat(64),
  ...change,
});

const PHOTOS = [
  photo("a", { path: "/2025-11/DSC09812.jpg", size: 19_293_798 }),
  photo("b", { path: "/2025-11/DSC09810.jpg", size: 18_769_510 }),
  photo("c", { path: "/IMG_4471.HEIC", size: 3_355_443 }),
  photo("d", {
    path: "/2025-10/夕暮れの稜線.jpg",
    size: 22_020_096,
    imported: { imageId: IMAGE_ID, importedAt: AT },
  }),
  photo("e", {
    path: "/2025-10/海霧.jpg",
    size: 15_938_355,
    imported: { imageId: null, importedAt: AT },
  }),
];

const withDropbox = (seed: FakeDropboxSeed) => (): FakeRoutes => ({
  ...createImageRoutes().routes,
  ...createDropboxRoutes(seed).routes,
});

const runPhoto = (
  index: number,
  status: NonNullable<FakeDropboxSeed["run"]>["photos"][number]["status"],
) => ({
  id: PHOTOS[index]?.id ?? "",
  path: PHOTOS[index]?.path ?? "",
  status,
  imageId: status === "added" ? IMAGE_ID : null,
});

const meta = {
  title: "screens/DropboxImport",
  component: AppPreview,
  args: {
    path: "/images/dropbox",
    createRoutes: withDropbox({
      connection: FAKE_DROPBOX_CONNECTED,
      photos: PHOTOS,
    }),
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

const withSeed = (seed: FakeDropboxSeed): Story => ({
  args: { createRoutes: withDropbox(seed) },
});

export const NewPhotos: Story = {};

export const Importing = withSeed({
  connection: FAKE_DROPBOX_CONNECTED,
  photos: PHOTOS,
  run: {
    startedAt: AT,
    finishedAt: null,
    photos: [
      runPhoto(0, "added"),
      runPhoto(1, "importing"),
      runPhoto(2, "waiting"),
    ],
  },
});

export const FinishedWithFailure = withSeed({
  connection: FAKE_DROPBOX_CONNECTED,
  photos: PHOTOS,
  run: {
    startedAt: AT,
    finishedAt: AT,
    photos: [
      runPhoto(0, "added"),
      runPhoto(1, "added"),
      runPhoto(2, "too-large"),
    ],
  },
});

export const EmptyFolder = withSeed({
  connection: FAKE_DROPBOX_CONNECTED,
  photos: [],
});

export const Disconnected = withSeed({});

export const ConnectionLost = withSeed({
  connection: FAKE_DROPBOX_CONNECTED,
  lost: true,
});

export const Unconfigured = withSeed({
  connection: { status: "unconfigured" },
});

export const Returned: Story = {
  args: {
    path: `/images/dropbox/callback?code=${FAKE_DROPBOX_RETURN.code}&state=${FAKE_DROPBOX_RETURN.state}`,
    createRoutes: withDropbox({}),
  },
};

export const ReturnedExpired: Story = {
  args: {
    path: `/images/dropbox/callback?code=${FAKE_DROPBOX_RETURN.code}&state=old`,
    createRoutes: withDropbox({}),
  },
};

export const ReturnedDenied: Story = {
  args: {
    path: "/images/dropbox/callback?error=access_denied&state=s",
    createRoutes: withDropbox({}),
  },
};
