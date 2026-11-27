import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ImageFieldPanel } from "../image-field-panel";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

const images = createImageRoutes(SAMPLE_IMAGES).images();
const [image] = images;
const unpublished = images.find((photo) => photo.status !== "published");

const meta = {
  title: "features/fixed-pages/ImageFieldPanel",
  component: ImageFieldPanel,
  parameters: { stage: "fill" },
  args: {
    label: "表紙",
    target: "表紙",
    selected: false,
    required: false,
    errorId: "cover-error",
    onChoose: fn<() => void>(),
    onRemove: fn<() => void>(),
  },
} satisfies Meta<typeof ImageFieldPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Selected: Story = { args: { selected: true, image } };

export const NoDeliveryImage: Story = {
  args: { selected: true, image: image && { ...image, deliveryImages: [] } },
};

export const Unpublished: Story = {
  args: { selected: true, image: unpublished },
};

const unconverted = image && { ...image, deliveryImages: [] };

export const Converting: Story = {
  args: {
    selected: true,
    image: unconverted && { ...unconverted, status: "processing" },
  },
};

export const Unreadable: Story = {
  args: {
    selected: true,
    image: unconverted && { ...unconverted, status: "unreadable" },
  },
};

export const Interrupted: Story = {
  args: {
    selected: true,
    image: unconverted && { ...unconverted, status: "interrupted" },
  },
};

const panorama = images.find((photo) => photo.title === "海霧のパノラマ");

export const Panorama: Story = {
  args: {
    selected: true,
    image: panorama && {
      ...panorama,
      title: "岬の展望台から眺める、朝の海霧に包まれた海岸線と遠くの島々",
      status: "unpublished",
    },
  },
};
