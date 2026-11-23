import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageViewer, ViewerFrame } from "@/features/images/ui/image-viewer";
import { samplePhoto } from "@/testing/sample-photos";
import { Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Link } from "@/ui/primitives/navigation";

const back = (
  <Text variant="caption">
    <Link href="/" variant="back">
      画像の一覧
    </Link>
  </Text>
);

const meta = {
  title: "features/images/ImageViewer",
  component: ImageViewer,
  decorators: [
    (Story) => (
      <ViewerFrame back={back} actions={<Button>非公開にする</Button>}>
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
  render: () => <ViewerLoading />,
};
