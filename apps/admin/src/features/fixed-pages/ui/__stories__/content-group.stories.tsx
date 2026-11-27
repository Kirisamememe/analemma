import type { Meta, StoryObj } from "@storybook/react-vite";

import { Branch, ContentGroup } from "@/features/fixed-pages/ui/content-group";
import { Button } from "@/ui/primitives/button";
import { TextField } from "@/ui/primitives/form-fields";
import { Icon } from "@/ui/primitives/graphics";

const actions = (label: string) => (
  <>
    <Button
      aria-label={`${label} を上へ`}
      icon="arrow-up"
      iconWeight="bold"
      isDisabled
      rounded="xs"
      size="sm"
      tone="quiet"
    />
    <Button
      aria-label={`${label} を下へ`}
      icon="arrow-down"
      iconWeight="bold"
      rounded="xs"
      size="sm"
      tone="quiet"
    />
    <Button
      aria-label={`${label} を削除`}
      icon="trash-2"
      iconWeight="bold"
      rounded="xs"
      size="sm"
      tone="quiet"
    />
  </>
);

const accounts = (error?: string, limit?: string) => (
  <ContentGroup kind="repeat" label="アカウント" error={undefined} inGroup>
    <Branch parent="repeat" target="item">
      <ContentGroup
        kind="item"
        label="アカウント 1"
        error={error}
        actions={actions("アカウント 1")}
      >
        <TextField name="service" label="サービス" defaultValue="日記" />
      </ContentGroup>
    </Branch>
    <Branch parent="repeat" target="add" isLast note={limit}>
      <Button isDisabled={limit !== undefined} size="sm" tone="secondary">
        <Icon name="plus" weight="bold" />
        アカウントを追加
      </Button>
    </Branch>
  </ContentGroup>
);

const meta = {
  title: "features/fixed-pages/ContentGroup",
  component: ContentGroup,
  args: {
    kind: "group",
    label: "プロフィール",
    error: undefined,
    children: (
      <>
        <Branch parent="group">
          <TextField name="name" label="名前" defaultValue="Aoi" />
        </Branch>
        <Branch parent="group" target="heading">
          {accounts()}
        </Branch>
        <Branch parent="group" isLast>
          <TextField name="role" label="肩書き" defaultValue="写真を撮る人" />
        </Branch>
      </>
    ),
  },
  parameters: { stage: "fill" },
} satisfies Meta<typeof ContentGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HeadingInMiddle: Story = {};

export const HeadingLast: Story = {
  args: {
    children: (
      <>
        <Branch parent="group">
          <TextField name="name" label="名前" defaultValue="Aoi" />
        </Branch>
        <Branch parent="group" target="heading" isLast>
          {accounts()}
        </Branch>
      </>
    ),
  },
};

export const Invalid: Story = {
  args: {
    error: "値を確認してください。",
    children: (
      <>
        <Branch parent="group">
          <TextField name="name" label="名前" defaultValue="Aoi" />
        </Branch>
        <Branch parent="group" target="heading" isLast>
          {accounts("値を確認してください。")}
        </Branch>
      </>
    ),
  },
};

export const Full: Story = {
  args: {
    children: (
      <>
        <Branch parent="group">
          <TextField name="name" label="名前" defaultValue="Aoi" />
        </Branch>
        <Branch parent="group" target="heading" isLast>
          {accounts(undefined, "追加できるのは100件までです")}
        </Branch>
      </>
    ),
  },
};
