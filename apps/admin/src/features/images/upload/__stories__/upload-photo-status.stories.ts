import type { Meta, StoryObj } from "@storybook/react-vite";

import type { PhotoUpload } from "../logic/photo-uploads";
import { UploadPhotoStatus } from "../upload-photo-status";

const photo = {
  id: 1,
  file: new File(["photo"], "morning-lake.jpg"),
  status: "waiting",
} satisfies PhotoUpload;

const meta = {
  title: "features/images/UploadPhotoStatus",
  component: UploadPhotoStatus,
  args: {
    upload: photo,
    retry: () => {},
    restore: () => {},
    imageHref: (id) => `/images/${id}`,
  },
} satisfies Meta<typeof UploadPhotoStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Waiting: Story = {};

export const Sending: Story = {
  args: { upload: { ...photo, status: "sending" } },
};

export const Uploaded: Story = {
  args: {
    upload: {
      ...photo,
      status: "added",
      imageId: "014627ab-cbae-4e41-ae26-048237da5a65",
    },
  },
};

export const TooLarge: Story = {
  args: { upload: { ...photo, status: "too-large" } },
};

export const Unsupported: Story = {
  args: { upload: { ...photo, status: "unsupported" } },
};

export const Failed: Story = {
  args: { upload: { ...photo, status: "failed" } },
};

export const Retrying: Story = {
  args: { upload: { ...photo, status: "sending", retried: true } },
};
