import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { ImagesSection } from "../images-section";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";
import { AppShell } from "@/ui/layout";

const MANY = Array.from({ length: 5 }, () => SAMPLE_IMAGES).flat();

const List = (): ReactNode => {
  const ready = useRouterState({ select: (state) => state.matches.length > 0 });

  return ready ? <ImagesSection imageHref={() => "/"} /> : null;
};

const Example = ({ moreFailed }: Record<"moreFailed", boolean>): ReactNode => {
  const [app] = useState(() => {
    const { routes } = createImageRoutes(MANY);
    const list = routes["admin/images/list"];

    const preview = createTestApp({
      path: "/",
      routes: {
        ...routes,
        "admin/images/list": (input) =>
          moreFailed && input.cursor !== undefined
            ? { error: "INTERNAL_SERVER_ERROR", defined: false }
            : list(input),
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
  title: "features/images/ImagesSection",
  component: Example,
  args: { moreFailed: false },
  parameters: { layout: "padded", stage: null },
} satisfies Meta<typeof Example>;

export default meta;

type Story = StoryObj<typeof meta>;

export const More: Story = {};
export const MoreFailed: Story = { args: { moreFailed: true } };
