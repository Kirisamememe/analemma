import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import {
  createPasskeyRoutes,
  type FakePasskeySeed,
} from "@/testing/fake-routes/create-passkey-routes";
import { failedReply, pendingReply } from "@/testing/fake-routes/fake-replies";

const PASSKEYS: readonly FakePasskeySeed[] = [
  { name: "MacBook Air", backedUp: true },
  { name: "iPhone", backedUp: true },
  { name: "YubiKey 5C NFC", backedUp: false },
];

const meta = {
  title: "screens/Security",
  component: AppPreview,
  args: {
    path: "/security",
    /** パスキーが3つある server。 */
    createRoutes: (): FakeRoutes => createPasskeyRoutes(PASSKEYS).routes,
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

export const SeveralPasskeys: Story = {};

export const OnePasskey: Story = {
  args: {
    /** パスキーが1つだけある server。 */
    createRoutes: () =>
      createPasskeyRoutes([{ name: "MacBook Air", backedUp: true }]).routes,
  },
};

export const LongName: Story = {
  args: {
    /** 空白の無い長い名前のパスキーがある server。 */
    createRoutes: () =>
      createPasskeyRoutes([
        {
          name: "passkey-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghij",
          backedUp: true,
        },
        { name: "iPhone", backedUp: true },
      ]).routes,
  },
};

export const Loading: Story = {
  args: {
    /** パスキーの一覧を返さない server。 */
    createRoutes: () => ({
      ...createPasskeyRoutes(PASSKEYS).routes,
      "admin/passkeys/list": async () =>
        pendingReply<FakeReply<"admin/passkeys/list">>(),
    }),
  },
};

export const LoadFailed: Story = {
  args: {
    /** パスキーの一覧を読めない server。 */
    createRoutes: () => ({
      ...createPasskeyRoutes(PASSKEYS).routes,
      "admin/passkeys/list": failedReply,
    }),
  },
};

export const AddReauthenticationFailed: Story = {
  args: {
    /** パスキーを追加しようとすると、再認証を断る server。 */
    createRoutes: () => ({
      ...createPasskeyRoutes(PASSKEYS).routes,
      "admin/passkeys/register": () => ({ error: "REAUTHENTICATION_FAILED" }),
    }),
  },
};
