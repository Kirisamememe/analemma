import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageDetail } from "../image-detail";

import { ViewerFrame } from "@/features/images/ui/viewer/viewer-frame";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { samplePhoto } from "@/testing/sample-photos";
import { Link } from "@/ui/primitives/navigation";

const photo = (seed: FakeImageSeed) => {
  const [image] = createImageRoutes([seed]).images();

  if (image === undefined) throw new Error("画像がありません");

  return image;
};

const meta = {
  title: "features/images/ImageDetail",
  component: ImageDetail,
  decorators: [
    (Story) => (
      <ViewerFrame
        back={
          <Link href="/" variant="back">
            一覧へ
          </Link>
        }
      >
        <Story />
      </ViewerFrame>
    ),
  ],
  args: {
    image: photo({
      title: "夕暮れの稜線",
      alt: "山並みに残る夕日",
      camera: "FUJIFILM X-T5",
      iso: 200,
      deliveryImages: samplePhoto("dusk-ridge"),
    }),
    next: { href: "/", label: "次の画像" },
    previous: undefined,
    onMove: () => undefined,
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof ImageDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithShotInfo: Story = {};

export const WithoutShotInfo: Story = {
  args: {
    image: photo({
      published: false,
      deliveryImages: samplePhoto("morning-lake"),
    }),
  },
};
