import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, spyOn, test } from "bun:test";

import { useImageListPosition } from "../use-image-list-position";

import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { withRouter } from "@/testing/hook-wrappers";

afterEach(cleanup);

const openList = async () => {
  const { router } = createTestApp({
    path: "/images",
    routes: createImageRoutes().routes,
  });

  await router.load();
  const root = document.createElement("div");
  document.body.append(root);

  const { result } = renderHook(useImageListPosition, {
    wrapper: withRouter(router),
    container: root,
  });

  const position = router.options.context.imageListPosition;
  position.current = { href: "/images/5", top: 380 };
  const photo = document.createElement("a");
  photo.href = "/images/5";
  root.append(photo);

  return { root, photo, position, restore: result.current };
};

const nextFrame = () =>
  new Promise<number>((resolve) => {
    requestAnimationFrame(resolve);
  });

test("一覧の描画後に写真へ focus と表示位置を戻し、使った位置を消す", async () => {
  const { root, photo, position, restore } = await openList();
  using scroll = spyOn(window, "scrollTo").mockImplementation(() => undefined);
  using intoView = spyOn(photo, "scrollIntoView");
  restore(root);
  await nextFrame();
  expect(document.activeElement).toBe(photo);
  expect(scroll).toHaveBeenCalledWith({ top: 380, behavior: "instant" });
  expect(intoView).toHaveBeenCalledWith({
    block: "nearest",
    behavior: "instant",
  });
  expect(position.current).toBeUndefined();
});

test("一覧を離れたときや待つ間に別の操作へ focus を移したときは、保存した位置に戻さない", async () => {
  const { root, photo, position, restore } = await openList();
  const cancel = restore(root);
  cancel?.();
  await nextFrame();
  expect(document.activeElement).not.toBe(photo);
  expect(position.current?.top).toBe(380);

  const button = document.createElement("button");
  root.append(button);
  restore(root);
  button.focus();
  await nextFrame();
  expect(document.activeElement).toBe(button);
  expect(position.current?.top).toBe(380);
});
