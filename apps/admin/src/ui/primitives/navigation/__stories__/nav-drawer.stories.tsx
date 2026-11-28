import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";

import { Center, Cluster, Heading, Text } from "@/ui/layout";
import { AppMark } from "@/ui/primitives/graphics";
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
      openLabel="ナビを開く"
      closeLabel="ナビを閉じる"
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
    openLabel: "ナビを開く",
    closeLabel: "ナビを閉じる",
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
