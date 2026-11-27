import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import {
  createFixedPageRoutes,
  type FakeFixedPageSeed,
} from "@/testing/fake-routes/create-fixed-page-routes";
import { failedReply, pendingReply } from "@/testing/fake-routes/fake-replies";

const KINDS = [
  { name: "page", label: "基本のページ", fields: [] },
  { name: "contact", label: "連絡先のページ", fields: [] },
];

const PAGES: readonly FakeFixedPageSeed[] = [
  { kind: "page", slug: "about", title: "About", published: true },
  { kind: "page", slug: "colophon", title: "Colophon", published: true },
  { kind: "contact", slug: "contact", title: "連絡先" },
  { kind: "page", slug: "privacy", title: "プライバシーポリシー" },
];

const STATE = { kinds: KINDS, pages: PAGES };

const meta = {
  title: "screens/FixedPages",
  component: AppPreview,
  args: {
    path: "/fixed-pages",
    /** 固定ページが4つある server。 */
    createRoutes: (): FakeRoutes => createFixedPageRoutes(STATE).routes,
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SeveralPages: Story = {};

export const Empty: Story = {
  args: {
    /** 固定ページが無い server。 */
    createRoutes: () =>
      createFixedPageRoutes({ kinds: KINDS, pages: [] }).routes,
  },
};

export const LongTitle: Story = {
  args: {
    /** 空白の無い長いタイトルと slug のページがある server。 */
    createRoutes: () =>
      createFixedPageRoutes({
        kinds: KINDS,
        pages: [
          {
            kind: "page",
            slug: "page-0123456789abcdefghijklmnopqrstuvwxyz0123456789",
            title:
              "page-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop",
            published: true,
          },
          ...PAGES.slice(0, 2),
        ],
      }).routes,
  },
};

export const Loading: Story = {
  args: {
    /** 固定ページの一覧を返さない server。 */
    createRoutes: () => ({
      ...createFixedPageRoutes(STATE).routes,
      "admin/fixedPages/list": async () =>
        pendingReply<FakeReply<"admin/fixedPages/list">>(),
    }),
  },
};

export const LoadFailed: Story = {
  args: {
    /** 固定ページの一覧を読めない server。 */
    createRoutes: () => ({
      ...createFixedPageRoutes(STATE).routes,
      "admin/fixedPages/list": failedReply,
    }),
  },
};

export const SavingOrder: Story = {
  args: {
    /** 並べ直しに答えない server(並べ直すと、送っている間の画面のまま止まる)。 */
    createRoutes: () => ({
      ...createFixedPageRoutes(STATE).routes,
      "admin/fixedPages/reorder": async () =>
        pendingReply<FakeReply<"admin/fixedPages/reorder">>(),
    }),
  },
};

export const OrderMismatch: Story = {
  args: {
    /** 並べ直しを ORDER_MISMATCH で断る server。 */
    createRoutes: () => ({
      ...createFixedPageRoutes(STATE).routes,
      "admin/fixedPages/reorder": () => ({ error: "ORDER_MISMATCH" }),
    }),
  },
};
