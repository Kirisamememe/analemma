import { type ReactNode, type Ref, useRef } from "react";
import { useDrop } from "react-aria";
import {
  type DropItem,
  type FileDropItem,
  FileTrigger,
} from "react-aria-components";

import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";

const fileDrop = tv({
  base: "rounded-control transition is-drop-target:bg-surface-sunken is-drop-target:state-hover",
});

type FileDropButtonProps = {
  /** ボタンの文言。 */
  children: ReactNode;
  /** 選べるファイルの種類(MIME type か、`.` で始まる拡張子)。 */
  acceptedTypes: readonly string[];
  /** 選んだか、落としたファイルを受け取る関数。 */
  onFiles: (files: readonly File[]) => void;
  /** ボタンを説明する要素の ID。 */
  descriptionId: string;
  /** ボタンの要素(focus を移すときに使う)。 */
  ref?: Ref<HTMLButtonElement>;
};

const isFile = (item: DropItem): item is FileDropItem => item.kind === "file";

const readFiles = async (
  items: readonly DropItem[],
): Promise<readonly File[]> =>
  Promise.all(
    items.filter((item) => isFile(item)).map(async (item) => item.getFile()),
  );

/** 押すとファイルを選ばせ、ファイルを落としても渡せる、一覧の先頭の追加ボタン。 */
export const FileDropButton = ({
  children,
  acceptedTypes,
  onFiles,
  descriptionId,
  ref,
}: FileDropButtonProps): ReactNode => {
  const area = useRef<HTMLDivElement>(null);

  const passFiles = async (items: readonly DropItem[]): Promise<void> => {
    const files = await readFiles(items);

    if (files.length > 0) onFiles(files);
  };

  const { dropProps, isDropTarget } = useDrop({
    ref: area,
    getDropOperation: () => "copy",
    onDrop: ({ items }) => {
      void passFiles(items);
    },
  });

  return (
    <div
      className={fileDrop()}
      data-drop-target={isDropTarget || undefined}
      ref={area}
      {...dropProps}
    >
      <FileTrigger
        acceptedFileTypes={[...acceptedTypes]}
        allowsMultiple
        onSelect={(list) => {
          if (list !== null && list.length > 0) onFiles(Array.from(list));
        }}
      >
        <Button
          aria-describedby={descriptionId}
          ref={ref}
          size="card"
          tone="dashed"
        >
          <Icon name="plus" />
          {children}
        </Button>
      </FileTrigger>
    </div>
  );
};
