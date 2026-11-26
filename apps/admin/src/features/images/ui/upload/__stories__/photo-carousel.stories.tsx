import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";

import { PhotoCarousel } from "../photo-carousel";

import { type SamplePhotoName, samplePhoto } from "@/testing/sample-photos";

const names: readonly SamplePhotoName[] = [
  "dusk-ridge",
  "morning-lake",
  "sea-mist",
  "snow-path",
  "dunes",
];

const photos = names.map((name, id) => ({
  id,
  name: `${name}.jpg`,
  source: samplePhoto(name)[0]?.url ?? "",
}));

const meta = {
  title: "features/images/PhotoCarousel",
  component: PhotoCarousel,
  args: {
    photos,
    selectedId: 0,
    label: "編集する写真",
    previous: "前の写真",
    next: "次の写真",
    missing: "プレビューなし",
    position: (current, total) => `${String(current)} / ${String(total)}`,
    onSelect: () => {},
  },
  parameters: { layout: "fullscreen", stage: null },
} satisfies Meta<typeof PhotoCarousel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 写真を選び直せるカルーセルの見本。 */
const CarouselStory = (args: ComponentProps<typeof PhotoCarousel>) => {
  const [selected, select] = useState(args.selectedId);
  return (
    <PhotoCarousel
      photos={args.photos}
      label={args.label}
      previous={args.previous}
      next={args.next}
      missing={args.missing}
      position={args.position}
      onSelect={select}
      selectedId={selected}
    />
  );
};

export const Photos: Story = { render: CarouselStory };

export const Transferring: Story = {
  render: CarouselStory,
  args: {
    photos: photos.map((photo, index) => ({
      ...photo,
      progress:
        index < 2
          ? { label: photo.name, percent: index === 0 ? 64 : 28 }
          : undefined,
    })),
  },
};
