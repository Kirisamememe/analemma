import type { Meta, StoryObj } from "@storybook/react-vite";

import { samplePhoto } from "@/testing/sample-photos";
import { AppShell } from "@/ui/layout";
import { ImageRows, ImageTile } from "@/ui/patterns/photos/image-rows";
import { ImageRowsPlaceholder } from "@/ui/patterns/photos/image-rows-placeholder";

const meta = {
  title: "patterns/photos/ImageRows",
  component: ImageRows,
  args: { label: "画像", children: null },
  decorators: [
    (Story) => (
      <AppShell>
        <Story />
      </AppShell>
    ),
  ],
  parameters: { layout: "padded", stage: null },
} satisfies Meta<typeof ImageRows>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tiles: Story = {
  args: {
    children: (
      <>
        <ImageTile
          date="2025/05/01"
          href="/"
          images={samplePhoto("dusk-ridge")}
          missing="表示用の画像がまだありません"
          title="夕暮れの稜線"
          untitled="無題"
        />
        <ImageTile
          alt="朝もやの中で山を映す湖"
          href="/"
          images={samplePhoto("morning-lake")}
          missing="表示用の画像がまだありません"
          title={null}
          untitled="無題"
        />
        <ImageTile
          badge="非公開"
          date="2024/04/02"
          href="/"
          images={samplePhoto("blossom")}
          missing="表示用の画像がまだありません"
          title="Sakura at Kiyosumi-shirakawa, early morning"
          untitled="無題"
        />
        <ImageTile
          href="/"
          images={samplePhoto("sea-mist")}
          missing="表示用の画像がまだありません"
          title="海霧のパノラマ"
          untitled="無題"
        />
        <ImageTile
          href="/"
          images={[]}
          missing="表示用の画像がまだありません"
          title="変換を待っている写真"
          untitled="無題"
        />
      </>
    ),
  },
};

export const Placeholder: Story = {
  /** 読み込む間の、写真の形の灰色の枠。 */
  render: () => <ImageRowsPlaceholder label="画像を読み込んでいます。" />,
};

export const UnpublishedPortrait: Story = {
  args: {
    children: (
      <ImageTile
        badge="非公開"
        href="/"
        images={samplePhoto("snow-path")}
        missing="表示用の画像がまだありません"
        title="雪の参道"
        untitled="無題"
      />
    ),
  },
};

export const Converting: Story = {
  args: {
    children: (
      <ImageTile
        badge="変換中"
        badgeTone="info"
        href="/"
        images={[]}
        isPending
        missing="表示用の画像を作っています"
        title={null}
        untitled="無題"
      />
    ),
  },
};

export const ConversionFailed: Story = {
  args: {
    children: (
      <ImageTile
        badge="変換失敗"
        badgeTone="danger"
        href="/"
        images={[]}
        missing="読み取れませんでした"
        title={null}
        untitled="無題"
      />
    ),
  },
};
