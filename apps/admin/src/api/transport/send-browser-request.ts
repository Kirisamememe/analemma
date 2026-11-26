import type { ApiClientOptions } from "../create-api-client";

/** 管理画面から送り、写真の転送中はブラウザが報告する進み具合を渡す。 */
export const sendBrowserRequest: ApiClientOptions["fetch"] = async (
  request,
  init,
) => {
  const { upload } = init;

  if (!upload) return fetch(request, init);

  const xhr = new XMLHttpRequest();

  const abort = () => {
    xhr.abort();
  };

  return new Promise<Response>((resolve, reject) => {
    request.signal.throwIfAborted();
    xhr.open(request.method, request.url);

    for (const [name, value] of request.headers) {
      if (name !== "content-type") xhr.setRequestHeader(name, value);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        upload.report(event.loaded / event.total);
      }
    });
    xhr.addEventListener("error", () => {
      reject(new TypeError("Network request failed"));
    });
    xhr.addEventListener("abort", () => {
      const reason: unknown = request.signal.reason;
      reject(
        reason instanceof Error
          ? reason
          : new DOMException("Aborted", "AbortError"),
      );
    });
    xhr.addEventListener("load", () => {
      if (xhr.responseURL !== request.url) {
        reject(new TypeError("Unexpected upload redirect"));
        return;
      }

      const headers = new Headers();

      for (const line of xhr.getAllResponseHeaders().trim().split(/\r?\n/v)) {
        const separator = line.indexOf(":");

        if (separator > 0) {
          headers.append(
            line.slice(0, separator),
            line.slice(separator + 1).trim(),
          );
        }
      }

      resolve(
        new Response(xhr.responseText || null, { status: xhr.status, headers }),
      );
    });
    request.signal.addEventListener("abort", abort, { once: true });
    xhr.send(upload.body);
  }).finally(() => {
    request.signal.removeEventListener("abort", abort);
  });
};
