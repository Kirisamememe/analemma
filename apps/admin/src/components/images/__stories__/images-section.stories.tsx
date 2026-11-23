import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { ImagePicker } from "../image-picker";
import { ImagesSection } from "../images-section";

import { useTranslate } from "@/i18n/use-translate";
import type { FakeReply } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";
import { AppShell } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";

const MANY = Array.from({ length: 5 }, () => SAMPLE_IMAGES).flat();

const List = ({ state }: Record<"state", State>): ReactNode => {
  const t = useTranslate();
  const [open, setOpen] = useState(true);
  const [count, setCount] = useState(0);

  const ready = useRouterState({
    select: (router) => router.matches.length > 0,
  });

  if (
    ready &&
    (state === "single" || state === "multiple" || state === "pending")
  ) {
    const close = (): void => {
      setOpen(false);
    };

    return (
      <>
        <Button
          onPress={() => {
            setOpen(true);
          }}
        >
          {t("imagePicker.title")}
        </Button>
        <output>{t("imagePicker.selected", { count })}</output>
        {open &&
          (state === "single" ? (
            <ImagePicker
              mode="single"
              onClose={close}
              onConfirm={() => {
                setCount(1);
                close();
              }}
            />
          ) : (
            <ImagePicker
              mode="multiple"
              isPending={state === "pending" && count > 0}
              onClose={close}
              onConfirm={(images) => {
                setCount(images.length);

                if (state !== "pending") close();
              }}
            />
          ))}
      </>
    );
  }

  return ready ? <ImagesSection imageHref={() => "/"} /> : null;
};

type State =
  | "pending"
  | "single"
  | "multiple"
  | "more"
  | "empty"
  | "loading"
  | "loadFailed"
  | "moreFailed";

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
          <List state={state} />
        </RouterContextProvider>
      </QueryClientProvider>
    </AppShell>
  );
};

const meta = {
  title: "features/images/ImagesSection",
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

export const Pending: Story = { args: { state: "pending" } };
export const Single: Story = { args: { state: "single" } };
export const Multiple: Story = { args: { state: "multiple" } };
