import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { UploadLeaveDialog } from "../upload-leave-dialog";

import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";

type LeavePhotoUploadProps = {
  /** 「完了」で破棄する、追加できなかった写真の枚数。 */
  discarded?: number | undefined;
};

const LeavePhotoUpload = ({ discarded }: LeavePhotoUploadProps): ReactNode => {
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
        {t(
          discarded === undefined ? "imageUpload.leave" : "imageUpload.finish",
        )}
      </Button>
      <UploadLeaveDialog
        leaving={{
          _tag: isOpen ? "Asking" : "Idle",
          stay: close,
          leave: close,
        }}
        discarded={discarded}
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

export const Discard: Story = { args: { discarded: 2 } };
