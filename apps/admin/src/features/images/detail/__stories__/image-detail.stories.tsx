import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageDetail } from "../image-detail";

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
  args: {
    back: (
      <Link href="/" variant="back">
        画像の一覧
      </Link>
    ),
    image: photo({
      title: "夕暮れの稜線",
      alt: "山並みに残る夕日",
      camera: "FUJIFILM X-T5",
      iso: 200,
      deliveryImages: samplePhoto("dusk-ridge"),
    }),
    next: "/",
    previous: undefined,
    onMove: () => undefined,
  },
  parameters: { layout: "fullscreen", stage: null },
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
