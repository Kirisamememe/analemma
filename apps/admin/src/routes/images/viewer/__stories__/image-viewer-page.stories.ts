import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { failedReply, pendingReply } from "@/testing/fake-routes/fake-replies";
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

const waitForPhoto = (id: string, milliseconds: number) =>
  id === IDS[0]
    ? undefined
    : new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
      });

export const DelayedNavigation: Story = {
  args: {
    /** 次の写真と前後の行き先を時間を分けて返す server。 */
    createRoutes: () => {
      const { routes } = createImageRoutes(SAMPLE_IMAGES);
      return {
        ...routes,
        "admin/images/get": async (input) => {
          await waitForPhoto(input.id, 500);
          return routes["admin/images/get"](input);
        },
        "admin/images/neighbors": async (input) => {
          await waitForPhoto(input.id, 850);
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

const withStatus = (
  status: "processing" | "unreadable" | "interrupted",
): Story => ({
  args: {
    path: pathOf(7),
    createRoutes: () =>
      createImageRoutes(
        SAMPLE_IMAGES.map((seed, index) =>
          index === 7 ? { ...seed, status } : seed,
        ),
      ).routes,
  },
});

export const Converting = withStatus("processing");
export const Unreadable = withStatus("unreadable");
export const Interrupted = withStatus("interrupted");

const withReplies = (overrides: FakeRoutes): Story => ({
  args: {
    createRoutes: () => ({
      ...createImageRoutes(SAMPLE_IMAGES).routes,
      ...overrides,
    }),
  },
});

export const Loading = withReplies({
  "admin/images/get": async () => pendingReply<FakeReply<"admin/images/get">>(),
});

export const LoadFailed = withReplies({ "admin/images/get": failedReply });

export const NeighborsFailed = withReplies({
  "admin/images/neighbors": failedReply,
});

export const Gone = atPath("/images/019b0000-0000-7000-8000-0000000000ff");

export const Saving = withReplies({
  "admin/images/update": async () =>
    pendingReply<FakeReply<"admin/images/update">>(),
});

export const SaveFailed = withReplies({ "admin/images/update": failedReply });
