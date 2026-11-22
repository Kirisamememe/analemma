import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "../../testing/app-preview";
import { createFakeAuthenticator } from "../../testing/create-fake-authenticator";
import { createSignInRoutes } from "../../testing/create-sign-in-routes";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const meta = {
  title: "screens/Login",
  component: AppPreview,
  args: {
    path: "/login",
    /** ログインの検証が成功する server。 */
    createRoutes: () => createSignInRoutes(EXPIRY),
    authenticator: createFakeAuthenticator(),
  },
  parameters: { layout: "fullscreen", contentLang: null, stage: null },
} satisfies Meta<typeof AppPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Cancelled: Story = {
  args: {
    authenticator: createFakeAuthenticator({
      authenticate: { _tag: "Cancelled" },
    }),
  },
};

export const UnknownPasskey: Story = {
  args: {
    /** 登録されていないパスキーとして断る server。 */
    createRoutes: () =>
      createSignInRoutes({ error: "UNKNOWN_CREDENTIAL", status: 401 }),
  },
};
