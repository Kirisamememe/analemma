import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";

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

const detail = `/series/${SAMPLE_SERIES_ID}`;
export const Detail: Story = { args: { path: detail } };

export const EmptySeries: Story = {
  args: {
    path: detail,
    /** 画像の無いシリーズ。 */
    createRoutes: () => createSeriesRoutes("empty"),
  },
};

export const DetailLoading: Story = {
  args: {
    path: detail,
    /** 詳細の取得を待つ server。 */
    createRoutes: () => ({
      ...createSeriesRoutes(),
      "admin/series/get": () =>
        Promise.withResolvers<FakeReply<"admin/series/get">>().promise,
    }),
  },
};

export const DetailLoadFailed: Story = {
  args: {
    path: detail,
    /** 詳細を読み込めない server。 */
    createRoutes: () => ({
      ...createSeriesRoutes(),
      "admin/series/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const SaveFailed: Story = {
  args: {
    path: detail,
    /** 名前・slug・説明の保存に失敗する server。 */
    createRoutes: () => ({
      ...createSeriesRoutes(),
      "admin/series/update": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const OrderMismatch: Story = {
  args: {
    path: detail,
    /** 並べ直す直前に末尾の画像が外された server。 */
    createRoutes: () => {
      const routes = createSeriesRoutes();
      return {
        ...routes,
        "admin/series/reorder": ({ id, imageIds }) => {
          routes["admin/series/removeImages"]({
            id,
            imageIds: imageIds.slice(-1),
          });

          return routes["admin/series/reorder"]({ id, imageIds });
        },
      };
    },
  },
};
