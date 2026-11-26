import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeOutput, FakeRoutes } from "@/testing/create-fake-api";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";

// --------------------
// 編集画面の見本のデータと作り物の server
// --------------------

const library = createImageRoutes(SAMPLE_IMAGES);
const [cover] = library.images();
const privateCover = library.images().find((image) => !image.published);

const portrait = library.images().find((image) => image.title === "細い路地");

if (!cover || !privateCover || !portrait) {
  throw new Error("見本の画像がありません");
}

const DATE = "2026-03-01T09:00:00.000Z";
const PAGE_ID = "019a0000-0000-7000-8000-000000000001";

const ABOUT = {
  name: "about",
  label: "About",
  createdAt: DATE,
  updatedAt: DATE,
  fields: [
    { key: "cover", type: "image", label: "表紙", optional: false },
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
        {
          key: "accounts",
          type: "repeat",
          label: "アカウント",
          optional: true,
          fields: [
            {
              key: "service",
              type: "text",
              label: "サービス",
              optional: false,
            },
            { key: "url", type: "url", label: "URL", optional: false },
          ],
        },
      ],
    },
    {
      key: "links",
      type: "repeat",
      label: "リンク",
      optional: true,
      fields: [
        { key: "label", type: "text", label: "表示名", optional: false },
        { key: "photo", type: "image", label: "写真", optional: true },
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
    cover: cover.id,
    lead: "写真と文章を置いている個人サイトです。",
    body: "撮った写真と、旅の記録を置いています。\n更新はゆっくりです。",
    website: "https://example.com",
    since: 2014,
    showContact: true,
    updated: "2026-02-28",
    layout: "narrow",
    profile: {
      name: "Aoi",
      role: "写真を撮る人",
      accounts: [
        { service: "写真の置き場", url: "https://example.com/photos" },
      ],
    },
    links: [
      {
        label: "写真",
        url: "https://example.com/photos",
        photo: privateCover.id,
      },
      { label: "日記", url: "https://example.com/notes" },
      { label: "連絡先", url: "https://example.com/contact" },
    ],
  },
} satisfies FakeOutput<"admin/fixedPages/get">;

const signedIn = {
  ...library.routes,
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

// --------------------
// 画像の項目
// --------------------

const imageArgs = (coverId?: string, optional = false) => ({
  /** 表紙を指定した状態で開き、保存時に定義で中身を確かめる server。 */
  createRoutes: () => {
    const { cover: _, ...rest } = PAGE.content;
    const content = coverId === undefined ? rest : { ...rest, cover: coverId };

    const fields = ABOUT.fields.map((field) =>
      field.type === "image" ? { ...field, optional } : field,
    );

    const server = createFixedPageRoutes({
      kinds: [{ name: ABOUT.name, label: ABOUT.label, fields }],
      pages: [{ ...PAGE, content }],
    });

    return { ...library.routes, ...server.routes };
  },
});

export const SelectedImage: Story = { args: imageArgs(cover.id, true) };

export const PortraitImage: Story = { args: imageArgs(portrait.id, true) };

export const EmptyImage: Story = { args: imageArgs(undefined, true) };
export const UnpublishedImage: Story = { args: imageArgs(privateCover.id) };
export const MissingImage: Story = { args: imageArgs(PAGE_ID) };
export const RequiredImageError: Story = { args: imageArgs() };

// --------------------
// 固定ページの作成・保存・削除
// --------------------

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
            { path: ["profile", "accounts", 0], code: "custom", message: "" },
            { path: ["links"], code: "custom", message: "Invalid" },
            { path: ["links", 1, "url"], code: "invalid_format", message: "" },
            { path: ["retired"], code: "invalid_type", message: "" },
          ],
        },
      }),
    }),
  },
};

export const InvalidRepeatItem: Story = {
  args: {
    /** 保存すると最初のアカウントに誤りを返す server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/update": () => ({
        error: "INVALID_CONTENT",
        data: {
          issues: [
            { path: ["profile", "accounts", 0], code: "custom", message: "" },
          ],
        },
      }),
    }),
  },
};

export const Saving: Story = {
  args: {
    /** 保存に少し時間がかかる server。 */
    createRoutes: () => ({
      ...signedIn,
      "admin/fixedPages/update": async (input) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 2500);
        });

        return signedIn["admin/fixedPages/update"](input);
      },
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

// --------------------
// 読み込みの失敗
// --------------------

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
