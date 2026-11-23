import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type {
  FakeOutput,
  FakeReply,
  FakeRoutes,
} from "@/testing/create-fake-api";

const DATE = "2026-03-01T09:00:00.000Z";
const PAGE_ID = "019a0000-0000-7000-8000-000000000001";

const ABOUT = {
  name: "about",
  label: "About",
  createdAt: DATE,
  updatedAt: DATE,
  fields: [
    { key: "lead", type: "text", label: "リード文", optional: false },
    { key: "body", type: "longText", label: "本文", optional: false },
    { key: "website", type: "url", label: "Web サイト", optional: true },
    { key: "since", type: "number", label: "活動を始めた年", optional: true },
    {
      key: "showContact",
      type: "boolean",
      label: "連絡先を出す",
      default: true,
    },
    { key: "updated", type: "date", label: "更新日", optional: true },
    {
      key: "layout",
      type: "select",
      label: "レイアウト",
      optional: true,
      options: [
        { value: "narrow", label: "狭い" },
        { value: "wide", label: "広い" },
      ],
    },
    {
      key: "profile",
      type: "group",
      label: "プロフィール",
      optional: false,
      fields: [
        { key: "name", type: "text", label: "名前", optional: false },
        { key: "role", type: "text", label: "肩書き", optional: true },
      ],
    },
    {
      key: "links",
      type: "repeat",
      label: "リンク",
      optional: true,
      fields: [
        { key: "label", type: "text", label: "表示名", optional: false },
        { key: "url", type: "url", label: "URL", optional: false },
      ],
    },
  ],
} satisfies FakeOutput<"admin/kinds/get">;

const COLOPHON = { ...ABOUT, name: "colophon", label: "Colophon" };

const PAGE = {
  id: PAGE_ID,
  kind: ABOUT.name,
  slug: "about",
  title: "このサイトについて",
  published: true,
  publishedAt: DATE,
  position: 0,
  createdAt: DATE,
  updatedAt: DATE,
  content: {
    lead: "写真と文章を置いている個人サイトです。",
    body: "撮った写真と、旅の記録を置いています。\n更新はゆっくりです。",
    website: "https://example.com",
    since: 2014,
    showContact: true,
    updated: "2026-02-28",
    layout: "narrow",
    profile: { name: "Aoi", role: "写真を撮る人" },
    links: [
      { label: "写真", url: "https://example.com/photos" },
      { label: "日記", url: "https://example.com/notes" },
      { label: "連絡先", url: "https://example.com/contact" },
    ],
  },
} satisfies FakeOutput<"admin/fixedPages/get">;

const signedIn = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-03-02T09:00:00Z" },
  }),
  "admin/kinds/list": () => ({
    output: { kinds: [ABOUT, COLOPHON].map(({ fields: _, ...kind }) => kind) },
  }),
  "admin/kinds/get": ({ name }) =>
    name === COLOPHON.name ? { output: COLOPHON } : { output: ABOUT },
  "admin/fixedPages/get": () => ({ output: PAGE }),
  "admin/fixedPages/create": ({ slug, title, content }) => ({
    output: { ...PAGE, slug, title, content },
  }),
  "admin/fixedPages/update": ({ slug, title, content }) => ({
    output: { ...PAGE, slug, title, content },
  }),
  "admin/fixedPages/delete": () => ({ output: undefined }),
  "admin/fixedPages/list": () => ({ output: { pages: [] } }),
} satisfies FakeRoutes;

const meta = {
  title: "screens/FixedPageEditor",
  component: AppPreview,
  args: {
    path: "/fixed-pages/" + PAGE_ID,
    /** 中身の入った固定ページがある server。 */
    createRoutes: (): FakeRoutes => signedIn,
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Edit: Story = {};

export const ChooseKind: Story = {
  args: { path: "/fixed-pages/new" },
};

export const NoKinds: Story = {
  args: {
    path: "/fixed-pages/new",
    /** 種類が1つも無い server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/kinds/list": () => ({ output: { kinds: [] } }),
    }),
  },
};

export const Create: Story = {
  args: { path: "/fixed-pages/new?kind=about" },
};

export const KindGone: Story = {
  args: {
    path: "/fixed-pages/new?kind=about",
    /** 選んだ種類が無い server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/kinds/get": () => ({ error: "NOT_FOUND" }),
    }),
  },
};

export const SlugTaken: Story = {
  args: {
    /** 保存すると slug の重複で断る server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/update": () => ({ error: "SLUG_TAKEN" }),
    }),
  },
};

export const InvalidContent: Story = {
  args: {
    /** 保存すると中身の issue を返す server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/update": () => ({
        error: "INVALID_CONTENT",
        data: {
          issues: [
            { path: ["lead"], code: "too_big", message: "Too big" },
            { path: ["profile", "name"], code: "invalid_type", message: "" },
            { path: ["links"], code: "custom", message: "Invalid" },
            { path: ["links", 1, "url"], code: "invalid_format", message: "" },
            { path: ["retired"], code: "invalid_type", message: "" },
          ],
        },
      }),
    }),
  },
};

export const Saving: Story = {
  args: {
    /** 保存に答えない server(保存を押すと、送信中のまま残る)。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/update": async () =>
        Promise.withResolvers<FakeReply<"admin/fixedPages/update">>().promise,
    }),
  },
};

export const SaveFailed: Story = {
  args: {
    /** 保存すると想定外の失敗を返す server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/update": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const DeleteFailed: Story = {
  args: {
    /** 削除すると想定外の失敗を返す server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/delete": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const KindLoadFailed: Story = {
  args: {
    /** 固定ページを取得でき、種類の取得だけが失敗する server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/kinds/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const PageLoadFailed: Story = {
  args: {
    /** 固定ページを取得できない server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const KindsLoadFailed: Story = {
  args: {
    path: "/fixed-pages/new",
    /** 選べる種類の一覧を取得できない server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/kinds/list": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const NewKindLoadFailed: Story = {
  args: {
    path: "/fixed-pages/new?kind=about",
    /** 選んだ種類の定義を取得できない server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/kinds/get": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const DeletedElsewhere: Story = {
  args: {
    /** 削除するとページが無いと答える server(ほかで消えていたときの Dialog)。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/delete": () => ({ error: "NOT_FOUND" }),
    }),
  },
};

export const PageGone: Story = {
  args: {
    /** 固定ページが無い server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/get": () => ({ error: "NOT_FOUND" }),
    }),
  },
};
