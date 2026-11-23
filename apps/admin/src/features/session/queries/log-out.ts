import type { ApiClient } from "@/api/api-types";

/** 今のセッションからログアウトする。 */
export const sendLogOut = (api: ApiClient) => api.admin.session.logOut();

/** すべてのセッションからログアウトする。 */
export const sendLogOutAll = (api: ApiClient) => api.admin.session.logOutAll();
