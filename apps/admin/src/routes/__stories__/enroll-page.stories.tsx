import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "../../testing/app-preview";
import { createEnrollmentRoutes } from "../../testing/create-enrollment-routes";
import { createFakeAuthenticator } from "../../testing/create-fake-authenticator";
import { createPasskeyRoutes } from "../../testing/create-passkey-routes";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const meta = {
  title: "screens/Enroll",
  component: AppPreview,
  args: {
    path: "/enroll#abc.def",
    /** 登録が成功し、その後のパスキーの画面も開ける server。 */
    createRoutes: () => ({
      ...createPasskeyRoutes([{ name: "MacBook Air", backedUp: true }]).routes,
      ...createEnrollmentRoutes(EXPIRY).routes,
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

export const MissingToken: Story = { args: { path: "/enroll" } };

export const InvalidUrl: Story = {
  args: {
    /** 期限切れや使用済みの登録用 URL として断る server。 */
    createRoutes: () =>
      createEnrollmentRoutes({ error: "INVALID_ENROLLMENT", status: 403 })
        .routes,
  },
};
