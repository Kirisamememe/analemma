import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, expect, spyOn, test } from "bun:test";
import { useState } from "react";

import type { PhotoUpload } from "../../logic/photo-uploads";
import { createUploadValue } from "../../upload-value";
import { UploadCarousel } from "../upload-carousel";

import * as previews from "@/features/images/ui/upload/hooks/use-photo-preview";
import * as carousel from "@/features/images/ui/upload/transfer-progress";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("1枚の転送率を知らせても別のリングとプレビューを描き直さず、写真を切り替えてもそのまま保つ", () => {
  const first = createUploadValue(0);
  const second = createUploadValue(0);

  const uploads: PhotoUpload[] = [
    {
      id: 1,
      file: new File(["1"], "one.jpg"),
      status: "sending",
      progress: first,
    },
    {
      id: 2,
      file: new File(["2"], "two.jpg"),
      status: "sending",
      progress: second,
    },
    { id: 3, file: new File(["3"], "three.jpg"), status: "waiting" },
  ];

  const Editor = () => {
    const [selected, select] = useState(1);
    return (
      <UploadCarousel
        selectedId={selected}
        onSelect={select}
        uploads={uploads}
      />
    );
  };

  using preview = spyOn(previews, "usePhotoPreview");
  using ring = spyOn(carousel, "TransferProgress");
  renderWithI18n(<Editor />, "ja");
  expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  preview.mockClear();
  ring.mockClear();
  act(() => {
    first.set(70);
  });
  expect(
    screen.getByRole("progressbar", { name: /one.jpg/v }).getAttribute("value"),
  ).toBe("70");
  expect(
    screen.getByRole("progressbar", { name: /two.jpg/v }).getAttribute("value"),
  ).toBe("0");
  expect(ring).toHaveBeenCalledTimes(1);
  expect(preview).not.toHaveBeenCalled();
  ring.mockClear();
  act(() => {
    screen.getByRole("button", { name: "three.jpg" }).click();
  });
  expect(screen.getByText("3 / 3")).toBeDefined();
  expect(ring).not.toHaveBeenCalled();
  expect(preview).not.toHaveBeenCalled();
});
