import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { UploadLeaveDialog } from "../upload-leave-dialog";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";

const LeavePhotoUpload = (): ReactNode => {
  const t = useTranslate();
  const [isOpen, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        onPress={() => {
          setOpen(true);
        }}
      >
        {t("imageUpload.leave")}
      </Button>
      <UploadLeaveDialog
        leaving={{
          _tag: isOpen ? "Asking" : "Idle",
          stay: close,
          leave: close,
        }}
      />
    </>
  );
};

const meta = {
  title: "features/images/UploadLeaveDialog",
  component: LeavePhotoUpload,
  parameters: { contentLang: null },
} satisfies Meta<typeof LeavePhotoUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirm: Story = {};
