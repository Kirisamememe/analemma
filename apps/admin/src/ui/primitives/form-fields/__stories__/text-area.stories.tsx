import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Form } from "../../form";
import { TextArea } from "../text-area";

const meta = {
  title: "primitives/TextArea",
  component: TextArea,
  parameters: { stage: "fill" },
  args: {
    name: "body",
    label: "本文",
    description: "公開するページの本文を入力してください。",
  },
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

const BODY = "雨の日は窓を開けて、通りの音を聞く。\n晴れたら裏通りを歩く。";

export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: BODY } };

export const Required: Story = { args: { isRequired: true } };

export const ReadOnly: Story = {
  args: { defaultValue: BODY, isReadOnly: true },
};

export const Disabled: Story = {
  args: { defaultValue: BODY, isDisabled: true },
};

export const Invalid: Story = {
  decorators: [
    (Story) => (
      <Form
        onSubmit={fn<(data: FormData) => void>()}
        validationErrors={{ body: "本文を確認してください。" }}
      >
        <Story />
      </Form>
    ),
  ],
  args: { defaultValue: BODY },
};
