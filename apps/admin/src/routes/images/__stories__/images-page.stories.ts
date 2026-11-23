import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES as IMAGES } from "@/testing/sample-photos";

const MANY: readonly FakeImageSeed[] = Array.from({ length: 4 }, () => [
  ...IMAGES,
  ...IMAGES,
]).flat();

const meta = {
  title: "screens/Images",
  component: AppPreview,
  args: {
    path: "/images",
    /** 画像が12枚ある server。 */
    createRoutes: (): FakeRoutes => createImageRoutes(IMAGES).routes,
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SeveralImages: Story = {};

export const ManyImages: Story = {
  args: {
    /** 画像が96枚ある server。 */
    createRoutes: () => createImageRoutes(MANY).routes,
  },
};

export const Empty: Story = {
  args: {
    /** 画像が無い server。 */
    createRoutes: () => createImageRoutes([]).routes,
  },
};

export const Loading: Story = {
  args: {
    /** 画像の一覧を返さない server。 */
    createRoutes: () => ({
      ...createImageRoutes(IMAGES).routes,
      "admin/images/list": async () =>
        Promise.withResolvers<FakeReply<"admin/images/list">>().promise,
    }),
  },
};

export const LoadFailed: Story = {
  args: {
    /** 画像の一覧を読めない server。 */
    createRoutes: () => ({
      ...createImageRoutes(IMAGES).routes,
      "admin/images/list": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const MoreFailed: Story = {
  args: {
    /** 最初のページだけを返し、続きを読めない server。 */
    createRoutes: () => {
      const { routes } = createImageRoutes(MANY);
      const list = routes["admin/images/list"];

      return {
        ...routes,
        "admin/images/list": (input) =>
          input.cursor === undefined
            ? list(input)
            : { error: "INTERNAL_SERVER_ERROR", defined: false },
      };
    },
  },
};
