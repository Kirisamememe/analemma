import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, type ReactNode, useState } from "react";

import { UploadPhotoFields } from "../upload-photo-fields";

type ExampleProps = Pick<
  ComponentProps<typeof UploadPhotoFields>,
  "values" | "isReadOnly"
>;

const PhotoFieldsExample = ({
  values: initial,
  isReadOnly,
}: ExampleProps): ReactNode => {
  const [values, setValues] = useState(initial);

  return (
    <UploadPhotoFields
      values={values}
      isReadOnly={isReadOnly}
      onChange={(changes) => {
        setValues((current) => ({ ...current, ...changes }));
      }}
    />
  );
};

const meta = {
  title: "features/images/UploadPhotoFields",
  component: PhotoFieldsExample,
  args: {
    values: { title: "", description: "" },
    isReadOnly: false,
  },
  parameters: { stage: "fill", contentLang: null },
} satisfies Meta<typeof PhotoFieldsExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editable: Story = {};

export const Saving: Story = {
  args: {
    isReadOnly: true,
    values: { title: "朝の海", description: "水平線に霧が残る" },
  },
};
