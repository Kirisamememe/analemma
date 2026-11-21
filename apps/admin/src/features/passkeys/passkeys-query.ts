import type { QueryClient } from "@tanstack/react-query";

/** パスキーの一覧の、query のキー。 */
export const PASSKEYS_QUERY_KEY = ["admin", "passkeys", "list"] as const;

/** 送っている一覧の取得を取り消してから、一覧を取り直す。 */
export const refreshPasskeys = async (
  queryClient: QueryClient,
): Promise<void> => {
  await queryClient.cancelQueries({ queryKey: PASSKEYS_QUERY_KEY });
  await queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY });
};
