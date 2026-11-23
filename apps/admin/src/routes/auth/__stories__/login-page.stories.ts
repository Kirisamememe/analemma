import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeRoutes } from "@/testing/create-fake-api";
import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import { createPasskeyRoutes } from "@/testing/fake-routes/create-passkey-routes";
import { createSignInRoutes } from "@/testing/fake-routes/create-sign-in-routes";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const meta = {
  title: "screens/Login",
  component: AppPreview,
  args: {
    path: "/login",
    /** ログインの検証が成功し、その後のパスキーの画面も開ける server。 */
    createRoutes: (): FakeRoutes => ({
      ...createPasskeyRoutes([{ name: "MacBook Air", backedUp: true }]).routes,
      ...createSignInRoutes(EXPIRY),
    }),
    authenticator: createFakeAuthenticator(),
  },
  argTypes: {
    path: { control: false },
    createRoutes: { control: false },
    authenticator: { control: false },
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
    createRoutes: () => createSignInRoutes({ error: "UNKNOWN_CREDENTIAL" }),
  },
};
