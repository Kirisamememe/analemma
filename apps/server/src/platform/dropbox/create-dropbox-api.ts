import type { DropboxApi } from "@/platform/dropbox/dropbox-api";
import { createDropboxFiles } from "@/platform/dropbox/dropbox-files";
import {
  createDropboxOAuth,
  type DropboxAppCredential,
  type DropboxFetch,
} from "@/platform/dropbox/dropbox-oauth";

/** Dropbox のアプリとして API を呼ぶ client を作る。 */
export const createDropboxApi = (
  credential: DropboxAppCredential,
  send: DropboxFetch = async (request) => fetch(request),
): DropboxApi => ({
  ...createDropboxOAuth(credential, send),
  ...createDropboxFiles(send),
});
