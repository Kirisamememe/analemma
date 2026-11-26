import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { type ComponentProps, useState } from "react";

import { PhotoCarousel } from "../photo-carousel";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

type Photos = ComponentProps<typeof PhotoCarousel>["photos"];

const photos: Photos = ["lake.jpg", "mountain.heic", "sea.jpg"].map(
  (name, id) => ({
    id,
    name,
    source: new File(["photo"], name),
  }),
);

const Editor = ({ uploads }: Record<"uploads", Photos>) => {
  const [selected, select] = useState(0);
  return (
    <PhotoCarousel
      photos={uploads}
      selectedId={selected}
      onSelect={select}
      label="編集する写真"
      previous="前の写真"
      next="次の写真"
      missing="プレビューなし"
      position={(current, total) => `${String(current)} / ${String(total)}`}
    />
  );
};

const button = (name: string) => screen.getByRole("button", { name });

describe("送る写真のカルーセル", () => {
  test("前後のボタンと矢印・Home・End で写真を選び、先頭と末尾で止まる", () => {
    renderWithI18n(<Editor uploads={photos} />, "ja");
    const first = button("lake.jpg");
    const middle = button("mountain.heic");
    const last = button("sea.jpg");
    expect(button("前の写真").hasAttribute("disabled")).toBe(true);
    expect(first.tabIndex).toBe(0);
    expect(middle.tabIndex).toBe(-1);
    fireEvent.click(button("次の写真"));
    expect(document.activeElement).toBe(middle);
    expect(middle.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("2 / 3")).toBeDefined();
    fireEvent.keyDown(middle, { key: "End" });
    expect(document.activeElement).toBe(last);
    expect(button("次の写真").hasAttribute("disabled")).toBe(true);
    fireEvent.keyDown(last, { key: "ArrowRight" });
    expect(last.getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(last, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(middle);
    fireEvent.keyDown(middle, { key: "Home" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement).toBe(middle);
    fireEvent.click(button("前の写真"));
    expect(document.activeElement).toBe(first);
  });

  test("写真を加えても選択を保ち、表示を終えた写真の Blob URL を解放する", () => {
    using created = spyOn(URL, "createObjectURL");
    using revoked = spyOn(URL, "revokeObjectURL");
    const view = renderWithI18n(<Editor uploads={photos.slice(0, 2)} />, "ja");
    fireEvent.click(button("mountain.heic"));
    const preview = within(button("mountain.heic")).getByAltText("");
    const url = preview.getAttribute("src");
    expect(url).toStartWith("blob:");
    view.rerender(<Editor uploads={photos} />);
    expect(screen.getByText("2 / 3")).toBeDefined();
    expect(
      within(button("mountain.heic")).getByAltText("").getAttribute("src"),
    ).toBe(url);
    expect(created).toHaveBeenCalledTimes(3);
    expect(revoked).not.toHaveBeenCalled();
    view.unmount();
    expect(revoked).toHaveBeenCalledWith(url);
    expect(revoked).toHaveBeenCalledTimes(3);
  });

  test("手元で読めない写真は配信用の画像が届いたら表示し、配信にも失敗したら文言に戻す", () => {
    const view = renderWithI18n(<Editor uploads={photos} />, "ja");
    const tile = within(button("mountain.heic"));
    fireEvent.error(tile.getByAltText(""));
    expect(tile.getByText("プレビューなし")).toBeDefined();
    const url = "/media/mountain/640.avif";
    view.rerender(
      <Editor
        uploads={photos.map(({ id, name, source }) => ({
          id,
          name,
          source,
          previewUrl: url,
        }))}
      />,
    );
    const delivered = tile.getByAltText("");
    expect(delivered.getAttribute("src")).toBe(url);
    expect(
      within(button("lake.jpg")).getByAltText("").getAttribute("src"),
    ).toStartWith("blob:");
    fireEvent.error(delivered);
    expect(tile.getByText("プレビューなし")).toBeDefined();
  });
});

test("別の写真を選んでも転送中の2枚の進捗が読め、転送が終わった写真から消える", () => {
  const transferring = photos.map((photo, index) => ({
    ...photo,
    progress:
      index < 2
        ? { label: photo.name, percent: index === 0 ? 64 : 28 }
        : undefined,
  }));

  const view = renderWithI18n(<Editor uploads={transferring} />, "ja");
  fireEvent.click(button("sea.jpg"));
  expect(
    screen.getByRole("progressbar", { name: "lake.jpg" }).getAttribute("value"),
  ).toBe("64");
  expect(
    screen
      .getByRole("progressbar", { name: "mountain.heic" })
      .getAttribute("value"),
  ).toBe("28");
  view.rerender(<Editor uploads={photos} />);
  expect(screen.queryByRole("progressbar")).toBeNull();
});
