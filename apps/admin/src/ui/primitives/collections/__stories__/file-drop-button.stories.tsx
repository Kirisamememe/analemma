import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Stack } from "@/ui/layout";
import { FileDropButton } from "@/ui/primitives/collections";

const meta = {
  title: "primitives/FileDropButton",
  component: FileDropButton,
  args: {
    acceptedTypes: ["image/jpeg", "image/heic"],
    children: "写真を追加",
    descriptionId: "file-drop-hint",
    onFiles: fn<(files: readonly File[]) => void>(),
  },
  decorators: [
    (Story) => (
      <Stack gap={1.5}>
        <Story />
        <span id="file-drop-hint">
          JPEG・HEIC。ここに写真を落としても追加できます。
        </span>
      </Stack>
    ),
  ],
} satisfies Meta<typeof FileDropButton>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
