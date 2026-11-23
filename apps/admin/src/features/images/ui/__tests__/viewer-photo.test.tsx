import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { ViewerPhoto } from "../viewer-photo";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const photo = (id: string) => {
  const image = { width: 640, height: 420, url: `/media/${id}/640.avif` };

  return (
    <ViewerPhoto
      alt="山並み"
      images={[image]}
      key={image.url}
      largest={image}
      smallest={image}
    />
  );
};

describe("ViewerPhoto", () => {
  test("配信に失敗した写真は手動で取り直し、失敗を繰り返したときは知らせる", () => {
    const { rerender } = renderWithI18n(photo("a"), "ja");
    expect(screen.getByRole("status").textContent).toContain(
      "写真を読み込んでいます",
    );
    fireEvent.error(screen.getByAltText("山並み"));
    expect(screen.getByRole("alert").textContent).toContain(
      "写真を読み込めませんでした",
    );
    fireEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    fireEvent.error(screen.getByAltText("山並み"));
    expect(screen.getByRole("alert").textContent).toContain(
      "まだ読み込めません",
    );
    fireEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    fireEvent.load(screen.getByAltText("山並み"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.error(screen.getByAltText("山並み"));
    rerender(photo("b"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toBeDefined();
  });
});
