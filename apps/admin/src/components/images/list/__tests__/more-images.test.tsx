import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { MoreImages } from "../more-images";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const ignore = (): void => undefined;

test("続きが無ければ、何も出さない", () => {
  renderWithI18n(
    <MoreImages next={{ _tag: "None" }} onLoad={ignore} retryRef={ignore} />,
    "ja",
  );

  expect(screen.queryByRole("button")).toBeNull();
});

test("続きがあれば、押すと読み始めを知らせてから続きを読む", async () => {
  const calls: string[] = [];

  renderWithI18n(
    <MoreImages
      next={{
        _tag: "Available",
        isLoading: false,
        load: () => {
          calls.push("load");
        },
      }}
      onLoad={() => {
        calls.push("onLoad");
      }}
      retryRef={ignore}
    />,
    "ja",
  );

  await userEvent.click(screen.getByRole("button", { name: "さらに読み込む" }));

  expect(calls).toEqual(["onLoad", "load"]);
});

test("続きを読めなければ知らせ、もう一度試すと、読み始めを知らせてから取り直す", async () => {
  const calls: string[] = [];

  renderWithI18n(
    <MoreImages
      next={{
        _tag: "Failed",
        isRetrying: false,
        retry: () => {
          calls.push("retry");
        },
      }}
      onLoad={() => {
        calls.push("onLoad");
      }}
      retryRef={ignore}
    />,
    "ja",
  );

  expect(
    screen.getByRole("heading", { name: "続きの画像を読み込めませんでした" }),
  ).toBeDefined();

  await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));

  expect(calls).toEqual(["onLoad", "retry"]);
});
