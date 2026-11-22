import type { Meta, StoryObj } from "@storybook/react-vite";

import type { Authenticator } from "@/features/auth/webauthn";
import { AppPreview } from "@/testing/app-preview";
import type { FakeReply, FakeRoutes } from "@/testing/create-fake-api";
import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import {
  createDeployTokenRoutes,
  type FakeDeployTokenSeed,
} from "@/testing/fake-routes/create-deploy-token-routes";

const TOKENS: readonly FakeDeployTokenSeed[] = [
  { name: "本番のデプロイ", lastUsedAt: "2026-02-03T04:05:00.000Z" },
  { name: "プレビューのデプロイ", lastUsedAt: "2026-02-01T10:20:00.000Z" },
  { name: "手元の確認", lastUsedAt: null },
];

const waitForever = <Value,>(): Promise<Value> =>
  Promise.withResolvers<Value>().promise;

/** 再認証の OS の画面を開いたまま、答えない認証器。 */
const WAITING_AUTHENTICATOR: Authenticator = {
  /** 再認証を待ったままにする。 */
  authenticate: () => waitForever(),
  /** パスキーの作成を待ったままにする。 */
  register: () => waitForever(),
};

const meta = {
  title: "screens/DeployTokens",
  component: AppPreview,
  args: {
    path: "/deploy-tokens",
    /** トークンが3つある server。 */
    createRoutes: (): FakeRoutes => createDeployTokenRoutes(TOKENS).routes,
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

export const SeveralTokens: Story = {};

export const Empty: Story = {
  args: {
    /** トークンが無い server。 */
    createRoutes: () => createDeployTokenRoutes([]).routes,
  },
};

export const LongName: Story = {
  args: {
    /** 空白の無い長い名前のトークンがある server。 */
    createRoutes: () =>
      createDeployTokenRoutes([
        {
          name: "deploy-0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijk",
          lastUsedAt: null,
        },
        { name: "本番のデプロイ", lastUsedAt: "2026-02-03T04:05:00.000Z" },
      ]).routes,
  },
};

export const Loading: Story = {
  args: {
    /** トークンの一覧を返さない server。 */
    createRoutes: () => ({
      ...createDeployTokenRoutes(TOKENS).routes,
      "admin/deployTokens/list": async () =>
        waitForever<FakeReply<"admin/deployTokens/list">>(),
    }),
  },
};

export const LoadFailed: Story = {
  args: {
    /** トークンの一覧を読めない server。 */
    createRoutes: () => ({
      ...createDeployTokenRoutes(TOKENS).routes,
      "admin/deployTokens/list": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    }),
  },
};

export const WaitingForReauthentication: Story = {
  args: {
    /** 発行を押すと、再認証を待ったままになる認証器。 */
    authenticator: WAITING_AUTHENTICATOR,
  },
};

export const ReauthenticationCancelled: Story = {
  args: {
    /** 発行を押すと、再認証をキャンセルする認証器。 */
    authenticator: createFakeAuthenticator({
      authenticate: { _tag: "Cancelled" },
    }),
  },
};

export const ReauthenticationFailed: Story = {
  args: {
    /** 発行を押すと、再認証を断る server。 */
    createRoutes: () => ({
      ...createDeployTokenRoutes(TOKENS).routes,
      "admin/deployTokens/issue": () => ({ error: "REAUTHENTICATION_FAILED" }),
    }),
  },
};

export const WaitingForRevoke: Story = {
  args: {
    /** 取り消しに答えない server。 */
    createRoutes: () => ({
      ...createDeployTokenRoutes(TOKENS).routes,
      "admin/deployTokens/revoke": async () =>
        waitForever<FakeReply<"admin/deployTokens/revoke">>(),
    }),
  },
};

export const RevokedElsewhere: Story = {
  args: {
    /** 取り消そうとすると、もう無いと答える server。 */
    createRoutes: () => ({
      ...createDeployTokenRoutes(TOKENS).routes,
      "admin/deployTokens/revoke": () => ({ error: "NOT_FOUND" }),
    }),
  },
};
