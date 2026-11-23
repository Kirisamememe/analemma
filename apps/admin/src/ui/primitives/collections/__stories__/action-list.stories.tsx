import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "@/ui/layout/text";
import { Button } from "@/ui/primitives/button";
import {
  ActionList,
  ActionListRow,
} from "@/ui/primitives/collections/action-list";

const rows = (card: boolean) =>
  ["MacBook Air", "iPhone"].map((name) => (
    <li key={name}>
      <ActionListRow card={card}>
        <Text>{name}</Text>
        <Button>名前を変更</Button>
      </ActionListRow>
    </li>
  ));

const meta = {
  title: "primitives/ActionList",
  component: ActionList,
  args: { children: rows(false) },
  parameters: { stage: "fill" },
} satisfies Meta<typeof ActionList>;

export default meta;
export const Default: StoryObj<typeof meta> = {};

export const Card: StoryObj<typeof meta> = { args: { children: rows(true) } };
