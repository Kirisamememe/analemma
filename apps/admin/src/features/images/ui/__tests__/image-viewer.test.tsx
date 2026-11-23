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
  Pick<Parameters<typeof ImageViewer>[0], "images" | "next" | "previous">
> &
  Pick<Parameters<typeof ImageViewer>[0], "onSwipe">;

const viewer = ({
  images = IMAGES,
  next,
  previous,
  onSwipe,
}: ViewerOptions) => (
  <ImageViewer
    actions={null}
    alt="山並み"
    back={null}
    images={images}
    missing="表示用の画像がまだありません"
    next={next}
    onSwipe={onSwipe}
    previous={previous}
  >
    情報
  </ImageViewer>
);

type Swipe = {
  /** 動かす要素。 */
  readonly target: HTMLElement;
  /** pointer の種類。 */
  readonly pointerType: string;
  /** 横に動かす量。 */
  readonly dx: number;
};

const swipe = ({ target, pointerType, dx }: Swipe) => {
  fireEvent.pointerDown(target, {
    pointerId: 1,
    pointerType,
    clientX: 200,
    clientY: 100,
  });
  fireEvent.pointerUp(target, {
    pointerId: 1,
    pointerType,
    clientX: 200 + dx,
    clientY: 110,
  });
};

describe("ImageViewer", () => {
  test("前後の画像は、渡したときだけリンクを置く", () => {
    renderWithI18n(
      viewer({
        next: { href: "/fixed-pages", label: "次の画像" },
        onSwipe: () => undefined,
      }),
    );

    expect(screen.getByRole("link", { name: "次の画像" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "前の画像" })).toBeNull();
  });

  test("配信用の画像が無ければ、写真の代わりに知らせを出す", () => {
    renderWithI18n(viewer({ images: [], onSwipe: () => undefined }));

    expect(screen.getByText("表示用の画像がまだありません")).toBeDefined();
    expect(screen.queryByRole("img", { name: "山並み" })).toBeNull();
  });

  test("タッチで左右にスワイプすると、向きを知らせ、マウスでは知らせない", () => {
    const directions: string[] = [];

    const onSwipe = (direction: string): void => {
      directions.push(direction);
    };

    renderWithI18n(viewer({ onSwipe }));

    const photo = screen.getByRole("img", { name: "山並み" });

    swipe({ target: photo, pointerType: "touch", dx: -120 });
    swipe({ target: photo, pointerType: "touch", dx: 120 });
    swipe({ target: photo, pointerType: "mouse", dx: -120 });
    expect(directions).toEqual(["next", "previous"]);
  });
});
