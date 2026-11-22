import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Cluster } from "../../layout/cluster";
import { Stack } from "../../layout/stack";
import { Text } from "../../layout/text";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { FocusScope } from "../focus-scope";

const PASSKEYS = ["MacBook Air", "iPhone", "iPad"];

const PasskeyRows = (): ReactNode => {
  const [passkeys, setPasskeys] = useState(PASSKEYS);
  const [deleting, setDeleting] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FocusScope>
      <Stack gap={4}>
        <Cluster>
          <Button
            onPress={() => {
              setPasskeys(PASSKEYS);
            }}
          >
            元に戻す
          </Button>
        </Cluster>
        <Stack as="ul" gap={2}>
          {passkeys.map((name) => (
            <li key={name}>
              <Cluster align="center" gap={4} justify="between">
                <Text as="span">{name}</Text>
                <Button
                  onPress={() => {
                    setDeleting(name);
                    setIsOpen(true);
                  }}
                  size="sm"
                  tone="danger"
                >
                  削除
                </Button>
              </Cluster>
            </li>
          ))}
        </Stack>
        <Dialog
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          title={`「${deleting}」を削除しますか?`}
        >
          <Text>
            削除すると、行と一緒に開いたボタンも消えるので、この範囲の最初のボタンに
            focus を移します。
          </Text>
          <Cluster gap={2} justify="end">
            <Button
              onPress={() => {
                setIsOpen(false);
              }}
            >
              キャンセル
            </Button>
            <Button
              onPress={() => {
                setPasskeys((current) =>
                  current.filter((name) => name !== deleting),
                );
                setIsOpen(false);
              }}
              tone="danger"
            >
              削除
            </Button>
          </Cluster>
        </Dialog>
      </Stack>
    </FocusScope>
  );
};

const meta = {
  title: "primitives/FocusScope",
  component: PasskeyRows,
  parameters: { stage: "fill" },
} satisfies Meta<typeof PasskeyRows>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
