import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useId, useState } from "react";

import { Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";
import { TextArea } from "@/ui/primitives/form-fields";
import { Modal, ModalActions, ModalSection } from "@/ui/primitives/overlays";

/** `EditModal` に渡す値。 */
type EditModalProps = {
  /** 本文の最大幅。 */
  width: "form" | "page";
  /** 下端の帯に、補足と操作を置くか。 */
  hasActions: boolean;
};

const EditModal = ({ width, hasActions }: EditModalProps): ReactNode => {
  const [isOpen, setIsOpen] = useState(true);
  const [description, setDescription] = useState("");
  const formId = useId();

  return (
    <>
      <Button
        onPress={() => {
          setIsOpen(true);
        }}
      >
        説明を編集
      </Button>
      <Modal
        closeLabel="閉じる"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="説明を編集"
        width={width}
        footer={
          hasActions
            ? {
                start: (
                  <Text tone="muted" variant="caption">
                    {description.length} 文字
                  </Text>
                ),
                end: (
                  <ModalActions>
                    <Button form={formId} tone="primary" type="submit">
                      完了
                    </Button>
                  </ModalActions>
                ),
              }
            : {}
        }
      >
        <ModalSection>
          <Form
            id={formId}
            onSubmit={() => {
              setIsOpen(false);
            }}
          >
            <TextArea
              requiredLabel="必須"
              label="説明"
              name="description"
              value={description}
              onChange={setDescription}
            />
          </Form>
        </ModalSection>
      </Modal>
    </>
  );
};

const meta = {
  title: "primitives/Modal",
  component: EditModal,
  args: { width: "form", hasActions: true },
} satisfies Meta<typeof EditModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PageWidth: Story = { args: { width: "page" } };

export const WithoutActions: Story = { args: { hasActions: false } };
