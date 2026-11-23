import type { ApiClient } from "@/api/api-types";

/** パスキーの一覧の、query のキー。 */
export const PASSKEYS_QUERY_KEY = ["admin", "passkeys", "list"] as const;

/** 登録したパスキーの一覧を読む。 */
export const loadPasskeys = (api: ApiClient) => api.admin.passkeys.list();
