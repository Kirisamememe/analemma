import type { TestBrowser, TestClient } from "@/test-client/create-test-client";

/** 管理画面と同じ手順で認可の画面を開き、作り物の Dropbox で許して戻り、つなぐ。 */
export const connectTestDropbox = async (
  server: TestClient,
  browser: TestBrowser = server,
) => {
  const { url } = await browser.client.admin.dropbox.authorize();
  const { code, state } = server.dropbox.approve(url);

  return browser.client.admin.dropbox.connect({ code, state });
};
