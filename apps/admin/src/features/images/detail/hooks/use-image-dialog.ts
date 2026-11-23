import { useState } from "react";

/** 指定した画像の操作中だけ開く Dialog。 */
export const useImageDialog = (id: string, isDisabled: boolean) => {
  const [openedId, setOpenedId] = useState<string>();
  const isOpen = openedId === id && !isDisabled;

  if (openedId !== undefined && !isOpen) setOpenedId(undefined);

  return {
    isOpen,
    open: () => {
      if (!isDisabled) setOpenedId(id);
    },
    close: () => {
      setOpenedId((current) => (current === id ? undefined : current));
    },
  };
};
