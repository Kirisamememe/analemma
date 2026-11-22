import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";

import { Center } from "@/ui/layout/center";
import { Cluster } from "@/ui/layout/cluster";
import { Heading } from "@/ui/layout/heading";
import { Text } from "@/ui/layout/text";
import { AppMark } from "@/ui/primitives/graphics/app-mark";
import {
  NavDrawer,
  type NavDrawerProps,
} from "@/ui/primitives/navigation/nav-drawer";

const DrawerPreview = ({
  label,
  heading,
  children,
  isOpen,
  onOpenChange,
}: NavDrawerProps): ReactElement => {
  const [, updateArgs] = useArgs<NavDrawerProps>();

  return (
    <NavDrawer
      heading={heading}
      isOpen={isOpen}
      label={label}
      onOpenChange={(open) => {
        onOpenChange(open);
        updateArgs({ isOpen: open });
      }}
    >
      {children}
    </NavDrawer>
  );
};

const meta = {
  title: "primitives/NavDrawer",
  component: NavDrawer,
  args: {
    label: "ナビ",
    heading: (
      <Cluster>
        <AppMark />
        <Heading level={2}>Stilus</Heading>
      </Cluster>
    ),
    children: (
      <Center width="sm">
        <Text>ナビの中身の見本です。</Text>
      </Center>
    ),
    onOpenChange: fn<NavDrawerProps["onOpenChange"]>(),
  },
  render: DrawerPreview,
} satisfies Meta<typeof NavDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { isOpen: true },
};
