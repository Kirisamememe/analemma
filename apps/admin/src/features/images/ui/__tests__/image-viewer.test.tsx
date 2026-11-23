import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { ImageViewer } from "@/features/images/ui/image-viewer";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const IMAGES = [
  { width: 640, height: 427, url: "/media/a/640.avif" },
  { width: 2560, height: 1707, url: "/media/a/2560.avif" },
];

type ViewerOptions = Partial<
  Pick<Parameters<typeof ImageViewer>[0], "images" | "next">
>;

const viewer = ({ images = IMAGES, next }: ViewerOptions) => (
  <ImageViewer
    alt="山並み"
    images={images}
    missing="表示用の画像がまだありません"
    next={next}
    onSwipe={() => undefined}
  >
    情報
  </ImageViewer>
);

describe("ImageViewer", () => {
  test("前後の画像は、渡したときだけリンクを置く", () => {
    renderWithI18n(
      viewer({
        next: { href: "/fixed-pages", label: "次の画像" },
      }),
    );

    expect(screen.getByRole("link", { name: "次の画像" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "前の画像" })).toBeNull();
  });

  test("配信に失敗した写真から別の写真に移ると、新しい写真を読み込む", () => {
    const { rerender } = renderWithI18n(viewer({}));
    fireEvent.error(screen.getByAltText("山並み"));
    expect(screen.getByRole("alert")).toBeDefined();
    rerender(
      viewer({
        images: [{ width: 640, height: 420, url: "/media/b/640.avif" }],
      }),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toBeDefined();
  });

  test("配信用の画像が無ければ、写真の代わりに知らせを出す", () => {
    renderWithI18n(viewer({ images: [] }));

    expect(screen.getByText("表示用の画像がまだありません")).toBeDefined();
    expect(screen.queryByRole("img", { name: "山並み" })).toBeNull();
  });
});
