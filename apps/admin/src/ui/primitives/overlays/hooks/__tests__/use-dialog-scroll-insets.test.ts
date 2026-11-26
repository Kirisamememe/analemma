import { renderHook } from "@testing-library/react";
import { expect, test } from "bun:test";

import { useDialogScrollInsets } from "../use-dialog-scroll-insets";

test("パネルごとに上下の帯の高さを確保し、フッターを外すと下の余白を解放する", () => {
  const dialog = document.createElement("div");
  const header = document.createElement("header");
  const footer = document.createElement("footer");
  dialog.append(header, footer);
  Object.defineProperty(header, "offsetHeight", { value: 56 });
  Object.defineProperty(footer, "offsetHeight", { value: 60 });
  const { result } = renderHook(useDialogScrollInsets);
  const detachHeader = result.current.attachHeader(header);
  const detachFooter = result.current.attachFooter(footer);
  expect(dialog.style.getPropertyValue("--dialog-header-height")).toBe("56px");
  expect(dialog.style.getPropertyValue("--dialog-footer-height")).toBe("60px");
  detachFooter?.();
  expect(dialog.style.getPropertyValue("--dialog-footer-height")).toBe("");
  expect(dialog.style.getPropertyValue("--dialog-header-height")).toBe("56px");
  detachHeader?.();
  expect(dialog.style.getPropertyValue("--dialog-header-height")).toBe("");
});
