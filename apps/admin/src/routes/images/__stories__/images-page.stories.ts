import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES as IMAGES, samplePhoto } from "@/testing/sample-photos";

const MANY: readonly FakeImageSeed[] = Array.from(
  { length: 8 },
  () => IMAGES,
).flat();

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

const withServer = (createRoutes: () => FakeRoutes): Story => ({
  args: { createRoutes },
});

export const SeveralImages: Story = {};
export const ManyImages = withServer(() => createImageRoutes(MANY).routes);
export const Empty = withServer(() => createImageRoutes([]).routes);

export const Loading = withServer(() => ({
  ...createImageRoutes(IMAGES).routes,
  "admin/images/list": async () =>
    Promise.withResolvers<FakeReply<"admin/images/list">>().promise,
}));

const failed = () =>
  ({ error: "INTERNAL_SERVER_ERROR", defined: false }) as const;

export const LoadFailed = withServer(() => ({
  ...createImageRoutes(IMAGES).routes,
  "admin/images/list": failed,
}));

export const MoreFailed = withServer(() => {
  const { routes } = createImageRoutes(MANY);

  return {
    ...routes,
    "admin/images/list": (input) =>
      input.cursor === undefined
        ? routes["admin/images/list"](input)
        : failed(),
  };
});

export const Uploading = withServer(() => {
  const { routes } = createImageRoutes(IMAGES, {
    deliveryImages: samplePhoto("blossom"),
  });

  return {
    ...routes,
    "admin/images/upload": async (input) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });

      return input.photo.name.includes("fail")
        ? failed()
        : routes["admin/images/upload"](input);
    },
  };
});
