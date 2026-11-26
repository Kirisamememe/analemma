import { useEffect, useEffectEvent, useState } from "react";

const carriesFiles = (data: DataTransfer | null): data is DataTransfer =>
  data !== null &&
  (data.types.includes("Files") ||
    Array.from(data.items).some((item) => item.kind === "file"));

/** 画像の一覧と、その上に開いた Dialog のどこに落とした写真も受け取る。 */
export const usePhotoDrop = (
  onFiles: (files: readonly File[]) => void,
): boolean => {
  const [isDragging, setDragging] = useState(false);
  const receive = useEffectEvent(onFiles);

  useEffect(() => {
    let depth = 0;

    const reset = (): void => {
      depth = 0;
      setDragging(false);
    };

    const enter = (event: DragEvent): void => {
      if (!carriesFiles(event.dataTransfer)) return;

      event.preventDefault();
      depth += 1;
      setDragging(true);
    };

    const over = (event: DragEvent): void => {
      const { dataTransfer } = event;

      if (!carriesFiles(dataTransfer)) return;

      event.preventDefault();
      dataTransfer.dropEffect = "copy";
    };

    const leave = (): void => {
      depth = Math.max(0, depth - 1);

      if (depth === 0) setDragging(false);
    };

    const drop = (event: DragEvent): void => {
      if (!carriesFiles(event.dataTransfer)) return;

      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);

      reset();

      if (files.length > 0) receive(files);
    };

    const controller = new AbortController();
    const options = { capture: true, signal: controller.signal };

    window.addEventListener("dragenter", enter, options);
    window.addEventListener("dragover", over, options);
    window.addEventListener("dragleave", leave, options);
    window.addEventListener("drop", drop, options);
    window.addEventListener("dragend", reset, options);

    return () => {
      controller.abort();
    };
  }, []);

  return isDragging;
};
