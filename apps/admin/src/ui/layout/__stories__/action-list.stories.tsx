import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActionList, ActionListRow } from "@/ui/layout/action-list";
import { Text } from "@/ui/layout/text";
import { Button } from "@/ui/primitives/button";

const meta = {
  title: "layout/ActionList",
  component: ActionList,
  args: {
    children: ["MacBook Air", "iPhone"].map((name) => (
      <li key={name}>
        <ActionListRow>
          <Text>{name}</Text>
          <Button>名前を変更</Button>
        </ActionListRow>
      </li>
    )),
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof ActionList>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
