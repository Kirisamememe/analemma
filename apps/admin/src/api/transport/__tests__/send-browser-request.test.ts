import { expect, mock, spyOn, test } from "bun:test";

import { sendBrowserRequest } from "../send-browser-request";

import { createApiClient } from "@/api/create-api-client";
import {
  createAuthGate,
  gateAdminRequests,
} from "@/features/auth/create-auth-gate";

const origin = "http://localhost:5173";

test("送信中の割合をその写真の呼び出しへ渡し、通信が途切れたら失敗する", async () => {
  const sent = Promise.withResolvers<XMLHttpRequest>();
  using send = spyOn(XMLHttpRequest.prototype, "send").mockImplementation(
    function (this: XMLHttpRequest) {
      sent.resolve(this);
    },
  );
  const report = mock<(fraction: number) => void>();
  const api = createApiClient({ origin, fetch: sendBrowserRequest });
  const photo = new File(["picture"], "lake.jpg", { type: "image/jpeg" });

  const uploading = api.admin.images.upload(
    { photo },
    { context: { onUploadProgress: report } },
  );

  const xhr = await sent.promise;
  const form = send.mock.calls[0]?.[0];

  if (!(form instanceof FormData)) throw new Error("FormData がありません");

  expect(form.get("0")).toMatchObject({ name: "lake.jpg", size: photo.size });

  xhr.upload.dispatchEvent(
    new ProgressEvent("progress", {
      lengthComputable: false,
      loaded: 0,
      total: 0,
    }),
  );
  xhr.upload.dispatchEvent(
    new ProgressEvent("progress", {
      lengthComputable: true,
      loaded: 1,
      total: 4,
    }),
  );
  expect(report.mock.calls).toEqual([[0.25]]);
  xhr.dispatchEvent(new Event("error"));
  expect(await uploading.catch((error: unknown) => error)).toEqual(
    new TypeError("Network request failed"),
  );
});

test("ログインが終わるまで送らず、待っている間に中断した写真を送らない", async () => {
  using send = spyOn(XMLHttpRequest.prototype, "send");
  const gate = createAuthGate();
  const login = Promise.withResolvers<undefined>();
  const authenticating = gate.authenticate(async () => login.promise);
  const controller = new AbortController();

  const api = createApiClient({
    origin,
    fetch: gateAdminRequests(gate, sendBrowserRequest),
  });

  const photo = new File(["picture"], "lake.jpg");

  const uploading = api.admin.images.upload(
    { photo },
    { signal: controller.signal, context: { onUploadProgress: () => {} } },
  );

  controller.abort();
  login.resolve();
  await authenticating;
  expect(await uploading.catch((error: unknown) => error)).toMatchObject({
    name: "AbortError",
  });
  expect(send).not.toHaveBeenCalled();
});

test("送信中に中断したらブラウザの送信を止め、待っている呼び出しにも中断を返す", async () => {
  const sent = Promise.withResolvers<XMLHttpRequest>();
  using send = spyOn(XMLHttpRequest.prototype, "send").mockImplementation(
    function (this: XMLHttpRequest) {
      sent.resolve(this);
    },
  );
  const controller = new AbortController();
  const api = createApiClient({ origin, fetch: sendBrowserRequest });
  const photo = new File(["picture"], "lake.jpg");

  const uploading = api.admin.images.upload(
    { photo },
    { signal: controller.signal, context: { onUploadProgress: () => {} } },
  );

  const xhr = await sent.promise;
  using abort = spyOn(xhr, "abort").mockImplementation(() => {
    xhr.dispatchEvent(new Event("abort"));
  });
  controller.abort();
  expect(await uploading.catch((error: unknown) => error)).toMatchObject({
    name: "AbortError",
  });
  expect(send).toHaveBeenCalledTimes(1);
  expect(abort).toHaveBeenCalledTimes(1);
});
