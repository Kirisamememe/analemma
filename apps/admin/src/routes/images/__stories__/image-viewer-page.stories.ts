import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

const IDS = createImageRoutes(SAMPLE_IMAGES)
  .images()
  .map(({ id }) => id); // 作り物の server は、作るたびに同じ ID を振る

const pathOf = (index: number): string => `/images/${IDS[index] ?? ""}`;

const meta = {
  title: "screens/ImageViewer",
  component: AppPreview,
  args: {
    path: pathOf(0),
    /** 画像が12枚ある server。 */
    createRoutes: (): FakeRoutes => createImageRoutes(SAMPLE_IMAGES).routes,
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAllDetails: Story = {};

export const DelayedNavigation: Story = {
  args: {
    /** 次の写真と前後の行き先を時間を分けて返す server。 */
    createRoutes: () => {
      const { routes } = createImageRoutes(SAMPLE_IMAGES);
      return {
        ...routes,
        "admin/images/get": async (input) => {
          if (input.id !== IDS[0]) {
            await new Promise((resolve) => {
              setTimeout(resolve, 500);
            });
          }

          return routes["admin/images/get"](input);
        },
        "admin/images/neighbors": async (input) => {
          if (input.id !== IDS[0]) {
            await new Promise((resolve) => {
              setTimeout(resolve, 850);
            });
          }

          return routes["admin/images/neighbors"](input);
        },
      };
    },
  },
};

const atPath = (path: string): Story => ({ args: { path } });

export const Portrait = atPath(pathOf(1));
export const Unpublished = atPath(pathOf(6));
export const NoDeliveryImage = atPath(pathOf(7));

const withReplies = (overrides: FakeRoutes): Story => ({
  args: {
    createRoutes: () => ({
      ...createImageRoutes(SAMPLE_IMAGES).routes,
      ...overrides,
    }),
  },
});

const failed = () =>
  ({ error: "INTERNAL_SERVER_ERROR", defined: false }) as const;

export const Loading = withReplies({
  "admin/images/get": async () =>
    Promise.withResolvers<FakeReply<"admin/images/get">>().promise,
});

export const LoadFailed = withReplies({ "admin/images/get": failed });

export const NeighborsFailed = withReplies({
  "admin/images/neighbors": failed,
});

export const Gone = atPath("/images/019b0000-0000-7000-8000-0000000000ff");

export const Saving = withReplies({
  "admin/images/update": async () =>
    Promise.withResolvers<FakeReply<"admin/images/update">>().promise,
});

export const SaveFailed = withReplies({ "admin/images/update": failed });
