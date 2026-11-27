import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageViewer } from "@/features/images/ui/viewer/image-viewer";
import { ViewerActions } from "@/features/images/ui/viewer/viewer-actions";
import { ViewerFrame } from "@/features/images/ui/viewer/viewer-frame";
import { samplePhoto } from "@/testing/sample-photos";
import { Text } from "@/ui/layout";
import { LoadingState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { Link } from "@/ui/primitives/navigation";

const back = (
  <Text variant="caption">
    <Link href="/" variant="back">
      一覧へ
    </Link>
  </Text>
);

type ViewerStoryContext = {
  /** 待機中の操作ボタンを表示する設定。 */
  parameters: {
    /** 次の写真を待っているか。 */
    waitingForNext?: boolean;
  };
};

const meta = {
  title: "features/images/ImageViewer",
  component: ImageViewer,
  decorators: [
    (Story, { parameters }: ViewerStoryContext) => (
      <ViewerFrame
        back={back}
        actions={
          <ViewerActions disabled={parameters.waitingForNext === true}>
            <Button size="sm-to-md">
              <Icon name="pencil" />
              編集
            </Button>
            <Button size="sm-to-md">非公開にする</Button>
            <Button aria-label="画像を削除" icon="trash-2" size="sm-to-md" />
          </ViewerActions>
        }
      >
        <Story />
      </ViewerFrame>
    ),
  ],
  args: {
    images: samplePhoto("dusk-ridge"),
    alt: "夕日の残る空の下に、山並みが二重に重なる",
    missing: "表示用の画像がまだありません",
    previous: { href: "/", label: "前の画像" },
    next: { href: "/", label: "次の画像" },
    onSwipe: () => undefined,
    children: <Text>FUJIFILM X-T5 · f/8</Text>,
  },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof ImageViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Landscape: Story = {};

export const Portrait: Story = {
  args: {
    alt: "朝もやの中で山を映す湖",
    images: samplePhoto("morning-lake"),
    previous: undefined,
  },
};

export const FailedPhoto: Story = {
  args: {
    images: [{ width: 640, height: 427, url: "/media/samples/missing.avif" }],
  },
};

export const NoDeliveryImage: Story = {
  args: { images: [], next: undefined },
};

export const Loading: Story = {
  /** 写真の代わりに、読み込んでいることを出す骨組み。 */
  render: () => <LoadingState layout="media" />,
};

export const WaitingForNext: Story = {
  args: { waiting: "写真を読み込んでいます。" },
  parameters: { waitingForNext: true },
};

export const Converting: Story = {
  args: {
    images: [],
    isPending: true,
    missing: "表示用の画像を作っています",
  },
};

export const ConversionFailed: Story = {
  args: {
    images: [],
    missing:
      "写真を読み取れませんでした。ファイルが壊れているか、対応していない形式です。削除して、別のファイルを追加してください。",
  },
};
