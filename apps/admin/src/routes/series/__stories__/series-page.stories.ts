import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createSeriesRoutes } from "@/testing/fake-routes/create-series-routes";

const meta = {
  title: "screens/Series",
  component: AppPreview,
  args: {
    path: "/series",
    createRoutes: (): FakeRoutes => createSeriesRoutes(),
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Photos: Story = {};

export const Empty: Story = {
  args: {
    /** シリーズの無い一覧。 */
    createRoutes: () => createSeriesRoutes("none"),
  },
};

export const Loading: Story = {
  args: {
    /** 読み込みを待っている一覧。 */
    createRoutes: () => ({
      ...createSeriesRoutes(),
      "admin/series/list": () =>
        Promise.withResolvers<FakeReply<"admin/series/list">>().promise,
    }),
  },
};

export const LoadFailed: Story = {
  args: {
    /** 読み込めない一覧。 */
    createRoutes: () => ({
      ...createSeriesRoutes(),
      "admin/series/list": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};
