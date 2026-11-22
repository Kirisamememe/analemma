import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../button";
import { Form } from "../form";
import { TextField } from "../form-fields/text-field";

const meta = {
  title: "primitives/Form",
  component: Form,
  parameters: { stage: "fill" },
  args: {
    onSubmit: fn<(data: FormData) => void>(),
    children: (
      <>
        <TextField isRequired label="パスキーの名前" name="name" />
        <Button tone="primary" type="submit">
          登録する
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    isPending: true,
    children: (
      <>
        <TextField
          defaultValue="MacBook Air"
          label="パスキーの名前"
          name="name"
        />
        <Button isPending tone="primary" type="submit">
          登録する
        </Button>
      </>
    ),
  },
};

export const ServerError: Story = {
  args: {
    validationErrors: { name: "同じ名前のパスキーがあります。" },
    children: (
      <>
        <TextField
          defaultValue="MacBook Air"
          label="パスキーの名前"
          name="name"
        />
        <Button tone="primary" type="submit">
          登録する
        </Button>
      </>
    ),
  },
};
