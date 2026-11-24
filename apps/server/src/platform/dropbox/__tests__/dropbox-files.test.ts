import { describe, expect, test } from "bun:test";

import { createDropboxApi } from "@/platform/dropbox/create-dropbox-api";
import {
  createFakeDropbox,
  TEST_DROPBOX_APP,
} from "@/test-client/create-fake-dropbox";

const REDIRECT_URI = "https://analemma.test/images/dropbox/callback";

const connect = async () => {
  const dropbox = createFakeDropbox();
  const api = createDropboxApi(TEST_DROPBOX_APP, dropbox.fetch);
  const { code } = dropbox.approve(api.authorize(REDIRECT_URI).url);
  const exchanged = await api.exchangeCode({ code, redirectUri: REDIRECT_URI });

  if (exchanged._tag !== "Authorized") throw new Error("つなげなかった");

  return { api, dropbox, token: exchanged.accessToken };
};

describe("createDropboxApi のファイル", () => {
  test("下のフォルダまでのファイルを、ページをまたいで読み、フォルダを除くこと", async () => {
    const { api, dropbox, token } = await connect();
    const paths = ["/a.jpg", "/b/c.jpg", "/d.png"];

    for (const path of paths) {
      await dropbox.put(path, new TextEncoder().encode(path));
    }

    const listed = await api.listFiles(token);

    expect(
      listed._tag === "Listed" && listed.files.map(({ path }) => path),
    ).toEqual(paths);
    expect(dropbox.requests).toContain("/2/files/list_folder/continue");
  });

  test("Dropbox と同じ求め方の content_hash を読むこと", async () => {
    const { api, dropbox, token } = await connect();
    const id = await dropbox.put("/a.jpg", new Uint8Array());
    const downloaded = await api.download(token, { fileId: id, maxBytes: 10 });

    expect(
      downloaded._tag === "Downloaded" && downloaded.file.contentHash,
    ).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  test("上限より大きいファイルは本文を読まず、無いファイルは無いと返すこと", async () => {
    const { api, dropbox, token } = await connect();
    const id = await dropbox.put("/a.jpg", new Uint8Array(11));

    expect(await api.download(token, { fileId: id, maxBytes: 10 })).toEqual({
      _tag: "TooLarge",
    });
    expect(
      await api.download(token, { fileId: "id:missing", maxBytes: 10 }),
    ).toEqual({ _tag: "NotFound" });
  });

  test("日本語の名前のファイルも読み、断るかを大きさより先に決めること", async () => {
    const { api, dropbox, token } = await connect();
    const id = await dropbox.put("/写真.jpg", new Uint8Array(11));

    expect(
      await api.download(token, {
        fileId: id,
        maxBytes: 10,
        accept: () => false,
      }),
    ).toMatchObject({ _tag: "Declined", file: { path: "/写真.jpg" } });
  });

  test("呼んだ側が断ったファイルは、本文を読まずにファイルだけを返すこと", async () => {
    const { api, dropbox, token } = await connect();
    const id = await dropbox.put("/a.jpg", new Uint8Array(3));
    const seen: string[] = [];

    const downloaded = await api.download(token, {
      fileId: id,
      maxBytes: 10,
      accept: (file) => {
        seen.push(file.contentHash);

        return false;
      },
    });

    expect(downloaded).toMatchObject({ _tag: "Declined", file: { id } });
    expect(seen).toHaveLength(1);
  });

  test("ASCII でない文字を、header に書ける形で送ること", async () => {
    const sent: string[] = [];

    const api = createDropboxApi(TEST_DROPBOX_APP, (request) => {
      sent.push(request.headers.get("dropbox-api-arg") ?? "");

      return Promise.resolve(
        Response.json({ error_summary: "path/not_found/" }, { status: 409 }),
      );
    });

    await api.download("token", { fileId: "/写真😀.jpg", maxBytes: 10 });

    const [header = ""] = sent;

    expect(header).toMatch(/^[\u0020-\u007E]+$/v);
    expect(JSON.parse(header)).toEqual({ path: "/写真😀.jpg" });
  });

  test("token が使えなくなったら、どの読み取りでもそう返すこと", async () => {
    const { api, dropbox, token } = await connect();
    const id = await dropbox.put("/a.jpg", new Uint8Array(1));

    dropbox.unlink();

    const unauthorized = { _tag: "Unauthorized" } as const;

    expect(await api.getAccount(token)).toEqual(unauthorized);
    expect(await api.listFiles(token)).toEqual(unauthorized);
    expect(await api.download(token, { fileId: id, maxBytes: 10 })).toEqual(
      unauthorized,
    );
  });
});
