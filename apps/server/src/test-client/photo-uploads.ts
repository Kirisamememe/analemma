import {
  type ConversionQueue,
  createConversionQueue,
} from "@/features/images/processing/conversion-queue";
import { TEST_ORIGIN, type TestClient } from "@/test-client/create-test-client";

const FIXTURES = {
  "wide-red.jpg": "../features/images/processing/__tests__/wide-red.jpg",
  "high-iso.jpg": "../features/images/processing/__tests__/high-iso.jpg",
  "red.bmp": "../features/images/processing/__tests__/red.bmp",
  "rotated-with-gps.heic": "../platform/images/__tests__/rotated-with-gps.heic",
};

/** テストで送る写真のファイルを読む。 */
export const photo = async (name: keyof typeof FIXTURES, type = "") => {
  const response = await fetch(new URL(FIXTURES[name], import.meta.url));

  return new File([await response.arrayBuffer()], name, { type });
};

/** テストで送る、写真の本文の大きさと Cookie。 */
export type UploadBody = {
  /** 本文の bytes の数。 */
  readonly size: number;
  /** Content-Length に書く値。 */
  readonly contentLength?: number;
  /** ログインしたブラウザの Cookie を付けるか。 */
  readonly cookie: boolean;
  /** `/api/admin/` の後ろのパス。 */
  readonly path?: string;
  /** size の大きさの 0 の並びの代わりに送る本文。 */
  readonly body?: ReadableStream<Uint8Array>;
};

/** 写真を送る procedure への、本文の大きさを決めたリクエストを作る。 */
export const uploadRequest = (
  server: TestClient,
  {
    size,
    contentLength = size,
    cookie,
    path = "images/upload",
    body,
  }: UploadBody,
): Request =>
  new Request(`${TEST_ORIGIN}/api/admin/${path}`, {
    method: "POST",
    headers: {
      origin: TEST_ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "multipart/form-data; boundary=photo",
      "content-length": String(contentLength),
      ...(cookie && { cookie: server.cookie() }),
    },
    body: body ?? new Uint8Array(size),
    ...(body !== undefined && { duplex: "half" }),
  });

/** テストが開けるまで、最初の変換を始めさせないキューを作る。 */
export const holdFirstConversion = () => {
  const queue = createConversionQueue();
  const gate = Promise.withResolvers<undefined>();
  let queued = 0;
  let converted = 0;

  const conversions: ConversionQueue = {
    run: async <T>(convert: () => Promise<T>): Promise<T> => {
      queued += 1;
      const order = queued;

      return queue.run(async () => {
        if (order === 1) await gate.promise;

        converted += 1;

        return convert();
      });
    },
  };

  return {
    conversions,
    release: () => {
      gate.resolve(undefined);
    },
    converted: () => converted,
  };
};
