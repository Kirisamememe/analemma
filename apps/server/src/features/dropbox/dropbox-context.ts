import {
  createDropboxAuthorizations,
  type DropboxAuthorizations,
} from "@/features/dropbox/connection/dropbox-authorizations";
import type { DropboxApi } from "@/platform/dropbox/dropbox-api";

/** Dropbox につなぎ、写真を取り込むための依存。 */
export type DropboxContext = {
  /** Dropbox のアプリとして API を呼ぶ client(未設定なら undefined)。 */
  readonly api: DropboxApi | undefined;
  /** 認可の画面から戻るのを待っている認可。 */
  readonly authorizations: DropboxAuthorizations;
};

/** server のプロセスで1つだけ持つ、Dropbox の依存を作る。 */
export const createDropboxContext = (
  api: DropboxApi | undefined,
): DropboxContext => ({
  api,
  authorizations: createDropboxAuthorizations(),
});
