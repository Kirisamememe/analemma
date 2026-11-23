import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { KindRefreshNotice } from "../kind-refresh-notice";

const ready = { retry: fn<() => void>(), isRetrying: false };

const meta = {
  title: "features/FixedPages/KindRefreshNotice",
  component: KindRefreshNotice,
  args: { source: "list", refreshFailure: ready },
  parameters: { contentLang: null },
} satisfies Meta<typeof KindRefreshNotice>;

export default meta;
type Story = StoryObj<typeof meta>;
export const List: Story = {};
export const Definition: Story = { args: { source: "definition" } };

export const Retrying: Story = {
  args: { refreshFailure: { ...ready, isRetrying: true } },
};
