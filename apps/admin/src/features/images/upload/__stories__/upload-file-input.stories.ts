import type { Meta, StoryObj } from "@storybook/react-vite";

import { UploadFileInput } from "../upload-file-input";

const meta = {
  title: "features/images/UploadFileInput",
  component: UploadFileInput,
  args: { onFiles: () => {} },
} satisfies Meta<typeof UploadFileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Choose: Story = {};
export const Disabled: Story = { args: { isDisabled: true } };
