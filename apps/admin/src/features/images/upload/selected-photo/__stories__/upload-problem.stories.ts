import type { Meta, StoryObj } from "@storybook/react-vite";

import { UploadProblem } from "../upload-problem";

const problem = {
  name: "morning-lake.jpg",
  message: "imageDetail.saveFailed",
  show: undefined,
} as const;

/** 見本では、写真を開かない。 */
const show = (): void => undefined;

const meta = {
  title: "features/images/UploadProblem",
  component: UploadProblem,
  args: { problem },
} satisfies Meta<typeof UploadProblem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SelectedPhoto: Story = {};

export const AnotherPhoto: Story = {
  args: { problem: { ...problem, show } },
};
