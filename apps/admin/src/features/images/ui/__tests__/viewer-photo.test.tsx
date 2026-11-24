import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

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
  test("配信に失敗した写真は手動で取り直し、失敗を繰り返したときは知らせる", async () => {
    renderWithI18n(photo("a"), "ja");
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await waitFor(() => {
      expect(status.textContent).toContain("写真を読み込んでいます");
    });
    fireEvent.error(screen.getByAltText("山並み"));
    expect(screen.getByRole("alert").textContent).toContain(
      "写真を読み込めませんでした",
    );
    const firstAttempt = screen.getByAltText("山並み");
    fireEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    fireEvent.load(firstAttempt);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.error(screen.getByAltText("山並み"));
    expect(screen.getByRole("alert").textContent).toContain(
      "まだ読み込めません",
    );
    const retry = screen.getByRole("button", { name: "もう一度試す" });
    retry.focus();
    fireEvent.click(retry);
    fireEvent.load(screen.getByAltText("山並み"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();

    expect(document.activeElement).toBe(screen.getByAltText("山並み"));
  });

  test("待っている次の写真は、読み込めても読み込めなくても、その写真の ID で知らせる", () => {
    const image = { width: 640, height: 420, url: "/media/b/640.avif" };
    const onSettled = mock((_id: string) => undefined);

    renderWithI18n(
      <ViewerPhoto
        alt="港"
        images={[image]}
        largest={image}
        smallest={image}
        pending
        photoId="b"
        onSettled={onSettled}
      />,
      "ja",
    );
    fireEvent.error(screen.getByAltText("港"));
    expect(onSettled).toHaveBeenCalledWith("b");
  });
});
