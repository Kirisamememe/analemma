import type { Meta, StoryObj } from "@storybook/react-vite";

import { UploadNotice } from "../upload-notice";

import type {
  PhotoUpload,
  UploadStatus,
} from "@/features/images/upload/logic/photo-uploads";

const uploads = (...statuses: UploadStatus[]): PhotoUpload[] =>
  statuses.map((status, index) => ({
    id: index + 1,
    file: new File(["photo"], `${String(index + 1)}.jpg`),
    status,
  }));

const meta = {
  title: "features/images/UploadNotice",
  component: UploadNotice,
  args: { uploads: uploads("added", "sending", "waiting") },
  parameters: { contentLang: null, stage: "fill" },
} satisfies Meta<typeof UploadNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sending: Story = {};

export const Converting: Story = {
  args: { uploads: uploads("added", "converting", "converting") },
};

export const Done: Story = { args: { uploads: uploads("added", "added") } };

export const PartiallyFailed: Story = {
  args: {
    uploads: uploads(
      "added",
      "converting",
      "unreadable",
      "interrupted",
      "failed",
      "too-large",
    ),
  },
};

export const AllFailed: Story = {
  args: { uploads: uploads("unreadable", "unsupported") },
};
