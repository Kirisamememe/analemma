import type { Meta, StoryObj } from "@storybook/react-vite";

import { QueryContent } from "@/components/query-content";
import { Text } from "@/ui/layout";

const ListContent = QueryContent<readonly string[]>;

/** 見本の取り直し。 */
const retry = (): void => undefined;

const meta = {
  title: "components/QueryContent",
  component: ListContent,
  args: {
    failedTitle: "パスキーを読み込めませんでした",
    level: 3,
    loading: "list",
    query: { _tag: "Loading" },
    children: (names) => <Text>{names.join("・")}</Text>,
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof ListContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const LoadingForm: Story = {
  args: { loading: "form" },
};

export const Failed: Story = {
  args: {
    query: { _tag: "Failed", isRetrying: false, retry },
  },
};

export const Retrying: Story = {
  args: { query: { _tag: "Failed", isRetrying: true, retry } },
};

export const Loaded: Story = {
  args: { query: { _tag: "Loaded", data: ["MacBook", "iPhone"] } },
};
