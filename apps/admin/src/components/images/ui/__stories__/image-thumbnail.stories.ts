import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageThumbnail } from "../image-thumbnail";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

const [image] = createImageRoutes(SAMPLE_IMAGES).images();

const meta = {
  title: "components/images/ImageThumbnail",
  component: ImageThumbnail,
  args: { src: image?.deliveryImages[0]?.url, alt: image?.alt },
} satisfies Meta<typeof ImageThumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Cover: Story = {};
export const Empty: Story = { args: { src: undefined } };
