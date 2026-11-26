import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { ImagesSection } from "../images-section";

import type { FakeReply } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";
import { AppShell } from "@/ui/layout";

const MANY = Array.from({ length: 5 }, () => SAMPLE_IMAGES).flat();

const List = (): ReactNode => {
  const ready = useRouterState({ select: (state) => state.matches.length > 0 });

  return ready ? <ImagesSection imageHref={() => "/"} /> : null;
};

type State = "more" | "empty" | "loading" | "loadFailed" | "moreFailed";

const Example = ({ state }: Record<"state", State>): ReactNode => {
  const [app] = useState(() => {
    const { routes } = createImageRoutes(state === "empty" ? [] : MANY);
    const list = routes["admin/images/list"];

    const preview = createTestApp({
      path: "/",
      routes: {
        ...routes,
        "admin/images/list": (input) => {
          if (state === "loading") {
            return Promise.withResolvers<FakeReply<"admin/images/list">>()
              .promise;
          }

          if (
            state === "loadFailed" ||
            (state === "moreFailed" && input.cursor !== undefined)
          ) {
            return { error: "INTERNAL_SERVER_ERROR", defined: false };
          }

          return list(input);
        },
      },
    });

    void preview.router.load();

    return preview;
  });

  return (
    <AppShell>
      <QueryClientProvider client={app.queryClient}>
        <RouterContextProvider router={app.router}>
          <List />
        </RouterContextProvider>
      </QueryClientProvider>
    </AppShell>
  );
};

const meta = {
  title: "components/images/ImagesSection",
  component: Example,
  args: { state: "more" },
  argTypes: { state: { control: false } },
  parameters: { layout: "padded", contentLang: null, stage: null },
} satisfies Meta<typeof Example>;

export default meta;

type Story = StoryObj<typeof meta>;

export const More: Story = {};
export const MoreFailed: Story = { args: { state: "moreFailed" } };
export const Empty: Story = { args: { state: "empty" } };
export const Loading: Story = { args: { state: "loading" } };
export const LoadFailed: Story = { args: { state: "loadFailed" } };
