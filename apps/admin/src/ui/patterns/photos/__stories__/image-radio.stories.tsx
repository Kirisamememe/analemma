import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";

import { ImageRadio, ImageSelectionStatus } from "../image-radio";
import { ImageRows, ImageTile } from "../image-rows";

import { samplePhoto } from "@/testing/sample-photos";
import { Stack } from "@/ui/layout";

const photos = [
  { name: "dusk-ridge", title: "夕暮れの稜線" },
  { name: "morning-lake", title: "朝の湖" },
] as const;

const Gallery = ({ disabled = false }) => {
  const group = useId();
  const [selected, setSelected] = useState("夕暮れの稜線");

  return (
    <Stack>
      <ImageRows label="写真を選ぶ">
        {photos.map(({ name, title }) => (
          <ImageTile
            key={name}
            singleChoice
            images={samplePhoto(name)}
            title={title}
            missing="表示用の画像がまだありません"
            untitled="無題"
            choice={
              <ImageRadio
                name={group}
                checked={selected === title}
                disabled={disabled}
                onChange={() => {
                  setSelected(title);
                }}
              />
            }
          />
        ))}
      </ImageRows>
      <ImageSelectionStatus label={selected} />
    </Stack>
  );
};

const meta = {
  title: "patterns/photos/ImageRadio",
  component: ImageRadio,
  render: ({ disabled }) => <Gallery disabled={disabled} />,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ImageRadio>;

export default meta;
type Story = StoryObj<typeof meta>;
export const SelectPhoto: Story = {};
export const Disabled: Story = { args: { disabled: true } };
