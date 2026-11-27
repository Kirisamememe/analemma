import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { ImageRows } from "@/ui/patterns/photos/image-rows";
import { ImageTile } from "@/ui/patterns/photos/image-tile";

afterEach(cleanup);

const IMAGES = [
  { width: 640, height: 427, url: "/media/a/640.avif" },
  { width: 1280, height: 853, url: "/media/a/1280.avif" },
];

type TileOptions = Partial<
  Pick<
    Parameters<typeof ImageTile>[0],
    "alt" | "badge" | "date" | "images" | "title"
  >
>;

const tile = ({
  alt = null,
  badge,
  date,
  images = IMAGES,
  title = "夕暮れの稜線",
}: TileOptions) => (
  <ImageRows label="画像">
    <ImageTile
      alt={alt}
      badge={badge}
      date={date}
      href="/fixed-pages/selected-photo"
      images={images}
      missing="表示用の画像がまだありません"
      title={title}
      untitled="無題"
    />
  </ImageRows>
);

describe("ImageTile", () => {
  test("タイトル・バッジ・日付を、開くリンクの中に出す", () => {
    renderWithI18n(tile({ badge: "非公開", date: "2025/05/01" }));

    const list = screen.getByRole("list", { name: "画像" });
    const link = within(list).getByRole("link");

    expect(link.getAttribute("href")).toBe("/fixed-pages/selected-photo");
    expect(within(link).getByText("夕暮れの稜線")).toBeDefined();
    expect(within(link).getByText("非公開")).toBeDefined();
    expect(within(link).getByText("2025/05/01")).toBeDefined();
    expect(screen.queryByText("表示用の画像がまだありません")).toBeNull();
  });

  test("タイトルが無ければ無題と出し、バッジと日付は渡したときだけ出す", () => {
    renderWithI18n(tile({ title: null }));

    expect(screen.getByRole("link").textContent).toBe("無題");
  });

  test("無題の画像に alt があれば、写真の内容でもリンクを見分けられる", () => {
    renderWithI18n(tile({ title: null, alt: "朝もやの湖" }));

    const link = screen.getByRole("link", { name: "朝もやの湖 無題" });
    const photo = within(link).getByRole("img", { name: "朝もやの湖" });

    expect(photo.getAttribute("src")).toBe("/media/a/640.avif");
    expect(photo.getAttribute("srcset")).toBe(
      "/media/a/640.avif 640w, /media/a/1280.avif 1280w",
    );
  });

  test("配信用の画像が無い無題の写真を、保存済みの alt で見分けられる", () => {
    renderWithI18n(tile({ images: [], title: null, alt: "霧の湖" }));
    expect(
      screen.getByRole("link", {
        name: /表示用の画像がまだありません 霧の湖 無題/v,
      }),
    ).toBeDefined();
  });

  test("配信用の画像が無ければ、写真の代わりに知らせを出す", () => {
    renderWithI18n(tile({ images: [] }));

    expect(
      within(screen.getByRole("link")).getByText(
        "表示用の画像がまだありません",
      ),
    ).toBeDefined();
  });
});
