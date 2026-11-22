import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "../../testing/app-preview";
import { createEnrollmentRoutes } from "../../testing/create-enrollment-routes";
import { createFakeAuthenticator } from "../../testing/create-fake-authenticator";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const meta = {
  title: "screens/Enroll",
  component: AppPreview,
  args: {
    path: "/enroll#abc.def",
    /** 登録が成功する server。 */
    createRoutes: () => createEnrollmentRoutes(EXPIRY).routes,
    authenticator: createFakeAuthenticator(),
  },
  parameters: { layout: "fullscreen", contentLang: null },
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
